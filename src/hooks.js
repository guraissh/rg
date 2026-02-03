import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getUser,
  getUserVideos,
  getCreatorTags,
  getPinnedVideos,
  getUserCollections,
  getMe,
  getMyFollowing,
  getMyNiches,
  getForYouFeed,
  getLikedFeed,
  getMyCollections,
  getCollectionGifs,
  getGif,
  getCollection,
  search,
} from './api';
import { useAuth } from './AuthContext';

export function useUser(username) {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => getUser(username),
    enabled: !!username,
  });
}

export function useUserVideos(username, options = {}) {
  const { page = 1, count = 40, order = 'recent' } = options;

  return useQuery({
    queryKey: ['userVideos', username, page, count, order],
    queryFn: () => getUserVideos(username, { page, count, order }),
    enabled: !!username,
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteUserVideos(username, options = {}) {
  const { count = 40, order = 'recent' } = options;

  return useInfiniteQuery({
    queryKey: ['infiniteUserVideos', username, count, order],
    queryFn: ({ pageParam = 1 }) => getUserVideos(username, { page: pageParam, count, order }),
    enabled: !!username,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function useCreatorTags(username) {
  return useQuery({
    queryKey: ['creatorTags', username],
    queryFn: () => getCreatorTags(username),
    enabled: !!username,
  });
}

export function usePinnedVideos(username) {
  return useQuery({
    queryKey: ['pinnedVideos', username],
    queryFn: () => getPinnedVideos(username),
    enabled: !!username,
  });
}

export function useUserCollections(username, options = {}) {
  const { page = 1, count = 20 } = options;

  return useQuery({
    queryKey: ['userCollections', username, page, count],
    queryFn: () => getUserCollections(username, { page, count }),
    enabled: !!username,
  });
}

// ============ Authenticated Hooks ============

export function useMe() {
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = await getToken();
      return getMe(token);
    },
    enabled: isAuthenticated,
  });
}

export function useMyFollowing(options = {}) {
  const { page = 1, count = 40 } = options;
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['myFollowing', page, count],
    queryFn: async () => {
      const token = await getToken();
      return getMyFollowing({ page, count, token });
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

export function useMyNiches() {
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['myNiches'],
    queryFn: async () => {
      const token = await getToken();
      return getMyNiches(token);
    },
    enabled: isAuthenticated,
  });
}

export function useForYouFeed(options = {}) {
  const { page = 1, count = 40 } = options;
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['forYouFeed', page, count],
    queryFn: async () => {
      const token = await getToken();
      return getForYouFeed({ page, count, token });
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

export function useLikedFeed(options = {}) {
  const { page = 1, count = 40, type = 'g' } = options;
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['likedFeed', page, count, type],
    queryFn: async () => {
      const token = await getToken();
      return getLikedFeed({ page, count, type, token });
    },
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

export function useMyCollections(options = {}) {
  const { page = 1, count = 20 } = options;
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['myCollections', page, count],
    queryFn: async () => {
      const token = await getToken();
      return getMyCollections({ page, count, token });
    },
    enabled: isAuthenticated,
  });
}

export function useCollectionGifs(collectionId, options = {}) {
  const { page = 1, count = 40 } = options;
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['collectionGifs', collectionId, page, count],
    queryFn: async () => {
      const token = await getToken();
      return getCollectionGifs(collectionId, { page, count, token });
    },
    enabled: isAuthenticated && !!collectionId,
    placeholderData: (previousData) => previousData,
  });
}

export function useGif(gifId) {
  return useQuery({
    queryKey: ['gif', gifId],
    queryFn: () => getGif(gifId),
    enabled: !!gifId,
  });
}

export function useCollection(collectionId) {
  const { isAuthenticated, getToken } = useAuth();

  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const token = await getToken();
      return getCollection(collectionId, { token });
    },
    enabled: isAuthenticated && !!collectionId,
  });
}

export function useSearch(options = {}) {
  const { tags = [], order = 'trending', count = 40, page = 1 } = options;

  return useQuery({
    queryKey: ['search', tags, order, count, page],
    queryFn: () => search({ tags, order, count, page }),
    enabled: tags.length > 0 && !!order,
    placeholderData: (previousData) => previousData,
  });
}
