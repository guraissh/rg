"""
RedGifs Viewer - FastAPI Backend
A simple alternative frontend for browsing RedGifs content
"""

import logging
import traceback
import time
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
import redgifs
from redgifs.enums import Order, MediaType
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# SQLite Cache Configuration
CACHE_DB_PATH = Path("cache.db")
CACHE_DURATION_HOURS = 24  # Cache for 24 hours

def init_cache_db():
    """Initialize the SQLite cache database"""
    conn = sqlite3.connect(CACHE_DB_PATH)
    cursor = conn.cursor()

    # Create cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS api_cache (
            cache_key TEXT PRIMARY KEY,
            response_data TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP NOT NULL
        )
    """)

    # Create index on expires_at for faster cleanup
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_expires_at ON api_cache(expires_at)
    """)

    conn.commit()
    conn.close()
    logger.info(f"Cache database initialized at {CACHE_DB_PATH}")

def get_from_cache(cache_key: str) -> Optional[dict]:
    """Retrieve data from cache if valid"""
    try:
        conn = sqlite3.connect(CACHE_DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT response_data, expires_at
            FROM api_cache
            WHERE cache_key = ?
        """, (cache_key,))

        result = cursor.fetchone()
        conn.close()

        if result:
            response_data, expires_at = result
            expires_datetime = datetime.fromisoformat(expires_at)

            # Check if cache is still valid
            if datetime.now() < expires_datetime:
                logger.info(f"Cache HIT: {cache_key}")
                return json.loads(response_data)
            else:
                logger.info(f"Cache EXPIRED: {cache_key}")
                # Delete expired entry
                delete_from_cache(cache_key)
        else:
            logger.info(f"Cache MISS: {cache_key}")

        return None
    except Exception as e:
        logger.error(f"Cache retrieval error: {str(e)}")
        return None

def save_to_cache(cache_key: str, response_data: dict, duration_hours: int = CACHE_DURATION_HOURS):
    """Save data to cache"""
    try:
        conn = sqlite3.connect(CACHE_DB_PATH)
        cursor = conn.cursor()

        created_at = datetime.now()
        expires_at = created_at + timedelta(hours=duration_hours)

        cursor.execute("""
            INSERT OR REPLACE INTO api_cache (cache_key, response_data, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        """, (
            cache_key,
            json.dumps(response_data),
            created_at.isoformat(),
            expires_at.isoformat()
        ))

        conn.commit()
        conn.close()
        logger.info(f"Cache SAVE: {cache_key} (expires in {duration_hours}h)")
    except Exception as e:
        logger.error(f"Cache save error: {str(e)}")

def delete_from_cache(cache_key: str):
    """Delete specific cache entry"""
    try:
        conn = sqlite3.connect(CACHE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM api_cache WHERE cache_key = ?", (cache_key,))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Cache delete error: {str(e)}")

def cleanup_expired_cache():
    """Remove all expired cache entries"""
    try:
        conn = sqlite3.connect(CACHE_DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM api_cache
            WHERE expires_at < ?
        """, (datetime.now().isoformat(),))

        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired cache entries")
    except Exception as e:
        logger.error(f"Cache cleanup error: {str(e)}")

# Initialize cache on startup
init_cache_db()
cleanup_expired_cache()

app = FastAPI(title="RedGifs Viewer")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log request details
    logger.info(f"Request: {request.method} {request.url.path}")
    logger.debug(f"Query params: {dict(request.query_params)}")
    logger.debug(f"Client: {request.client.host if request.client else 'Unknown'}")

    try:
        response = await call_next(request)

        # Log response
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.2f}ms"
        )

        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        logger.error(
            f"Request failed: {request.method} {request.url.path} - "
            f"Time: {process_time:.2f}ms - "
            f"Error: {str(e)}"
        )
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global API instance
api: Optional[redgifs.API] = None

def get_api() -> redgifs.API:
    """Get or create the RedGifs API instance"""
    global api
    if api is None:
        try:
            logger.info("Initializing RedGifs API client...")
            api = redgifs.API()
            logger.info("Logging in to RedGifs API...")
            api.login()
            logger.info("Successfully logged in to RedGifs API")
        except Exception as e:
            logger.error(f"Failed to initialize RedGifs API: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    return api


class SortOrder(str, Enum):
    trending = "trending"
    latest = "latest"
    top = "top"
    top28 = "top28"


def order_to_enum(order: SortOrder) -> Order:
    """Convert SortOrder string to redgifs Order enum"""
    mapping = {
        SortOrder.trending: Order.TRENDING,
        SortOrder.latest: Order.LATEST,
        SortOrder.top: Order.TOP,
        SortOrder.top28: Order.TOP28,
    }
    return mapping.get(order, Order.LATEST)


def gif_to_dict(gif) -> dict:
    """Convert a GIF object to a dictionary"""
    return {
        "id": gif.id,
        "create_date": gif.create_date.isoformat() if gif.create_date else None,
        "has_audio": gif.has_audio,
        "width": gif.width,
        "height": gif.height,
        "likes": gif.likes,
        "tags": gif.tags,
        "verified": gif.verified,
        "views": gif.views or 0,
        "duration": gif.duration,
        "published": gif.published,
        "username": gif.username,
        "avg_color": gif.avg_color,
        "urls": {
            "sd": gif.urls.sd,
            "hd": gif.urls.hd,
            "poster": gif.urls.poster,
            "thumbnail": gif.urls.thumbnail,
            "vthumbnail": gif.urls.vthumbnail,
            "web_url": gif.urls.web_url,
        }
    }


def user_to_dict(user) -> dict:
    """Convert a User object to a dictionary"""
    return {
        "username": user.username,
        "name": user.name,
        "description": user.description,
        "followers": user.followers,
        "following": user.following,
        "gifs": user.gifs,
        "published_gifs": user.published_gifs,
        "verified": user.verified,
        "views": user.views,
        "profile_image_url": user.profile_image_url,
        "url": user.url,
        "poster": user.poster,
        "thumbnail": user.thumbnail,
    }


@app.get("/")
async def root():
    """Serve the main HTML page"""
    return FileResponse("static/index.html")


@app.get("/api/user/{username}")
async def get_user(username: str):
    """Get user profile information"""
    try:
        # Create cache key
        cache_key = f"user_profile:{username}"

        # Try to get from cache first
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return cached_response

        # Cache miss - fetch from API
        rg = get_api()
        user = rg.get_user(username)
        response_data = user_to_dict(user)

        # Save to cache
        save_to_cache(cache_key, response_data)

        return response_data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"User not found: {str(e)}")


@app.get("/api/user/{username}/gifs")
async def get_user_gifs(
    username: str,
    page: int = Query(1, ge=1),
    count: int = Query(80, ge=1, le=150),
    order: SortOrder = Query(SortOrder.latest),
):
    """Get gifs from a specific user with pagination"""
    try:
        # Create cache key from request parameters
        cache_key = f"user_gifs:{username}:{page}:{count}:{order}"

        # Try to get from cache first
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return cached_response

        # Cache miss - fetch from API
        rg = get_api()
        result = rg.search_creator(
            username,
            page=page,
            count=count,
            order=order_to_enum(order),
            type=MediaType.GIF
        )

        response_data = {
            "page": result.page,
            "pages": result.pages,
            "total": result.total,
            "gifs": [gif_to_dict(g) for g in result.gifs],
            "creator": user_to_dict(result.creator) if result.creator else None,
        }

        # Save to cache
        save_to_cache(cache_key, response_data)

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search")
async def search_gifs(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    count: int = Query(80, ge=1, le=150),
    order: SortOrder = Query(SortOrder.trending),
):
    """Search for gifs by tag/keyword"""
    try:
        # Create cache key from request parameters
        cache_key = f"search:{q}:{page}:{count}:{order}"

        # Try to get from cache first
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return cached_response

        # Cache miss - fetch from API
        rg = get_api()
        result = rg.search(
            q,
            page=page,
            count=count,
            order=order_to_enum(order),
        )

        response_data = {
            "searched_for": result.searched_for,
            "page": result.page,
            "pages": result.pages,
            "total": result.total,
            "gifs": [gif_to_dict(g) for g in result.gifs] if result.gifs else [],
            "tags": result.tags,
        }

        # Save to cache
        save_to_cache(cache_key, response_data)

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trending")
async def get_trending():
    """Get trending gifs"""
    try:
        # Create cache key
        cache_key = "trending:gifs"

        # Try to get from cache first (shorter cache time for trending)
        cached_response = get_from_cache(cache_key)
        if cached_response:
            return cached_response

        # Cache miss - fetch from API
        rg = get_api()
        gifs = rg.get_trending_gifs()

        response_data = {
            "gifs": [gif_to_dict(g) for g in gifs]
        }

        # Save to cache with shorter duration (1 hour for trending content)
        save_to_cache(cache_key, response_data, duration_hours=1)

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/proxy")
async def proxy_media(url: str = Query(..., description="URL to proxy")):
    """Proxy media files from RedGifs to bypass CORB/ORB restrictions"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": "https://www.redgifs.com/"
                },
                follow_redirects=True,
                timeout=30.0
            )
            response.raise_for_status()

            # Determine content type
            content_type = response.headers.get("content-type", "application/octet-stream")

            return StreamingResponse(
                iter([response.content]),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*"
                }
            )
    except httpx.HTTPError as e:
        logger.error(f"Failed to proxy URL {url}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to fetch media: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error proxying URL {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
