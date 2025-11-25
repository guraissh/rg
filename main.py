"""
RedGifs Viewer - FastAPI Backend
A simple alternative frontend for browsing RedGifs content
"""

import logging
import traceback
import time
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
        rg = get_api()
        user = rg.get_user(username)
        return user_to_dict(user)
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
        rg = get_api()
        result = rg.search_creator(
            username,
            page=page,
            count=count,
            order=order_to_enum(order),
            type=MediaType.GIF
        )

        return {
            "page": result.page,
            "pages": result.pages,
            "total": result.total,
            "gifs": [gif_to_dict(g) for g in result.gifs],
            "creator": user_to_dict(result.creator) if result.creator else None,
        }
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
        rg = get_api()
        result = rg.search(
            q,
            page=page,
            count=count,
            order=order_to_enum(order),
        )

        return {
            "searched_for": result.searched_for,
            "page": result.page,
            "pages": result.pages,
            "total": result.total,
            "gifs": [gif_to_dict(g) for g in result.gifs] if result.gifs else [],
            "tags": result.tags,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/trending")
async def get_trending():
    """Get trending gifs"""
    try:
        rg = get_api()
        gifs = rg.get_trending_gifs()
        return {
            "gifs": [gif_to_dict(g) for g in gifs]
        }
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
