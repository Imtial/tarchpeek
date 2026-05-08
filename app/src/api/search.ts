import { customAxios } from './fetcher';
import type { Channel, Playlist, Video } from './generated/models';

type SearchQueryType = 'simple' | 'video' | 'channel' | 'playlist' | 'full';

type SearchFulltextResult = {
  subtitle_index: number;
  subtitle_line: string;
  subtitle_start: string;
  subtitle_fragment_id: string;
  subtitle_end: string;
  youtube_id: string;
  title: string;
  subtitle_channel: string;
  subtitle_channel_id: string;
  subtitle_last_refresh: number;
  subtitle_lang: string;
  subtitle_source: string;
  vid_thumb_url: string;
  _index: string;
  _score: number;
};

type SearchApiResponse = {
  results: {
    video_results: Video[];
    channel_results: Channel[];
    playlist_results: Playlist[];
    fulltext_results: SearchFulltextResult[];
  };
  queryType: SearchQueryType;
};

function searchRetrieve(
  query: string,
  options?: Parameters<typeof customAxios<SearchApiResponse>>[1],
) {
  return customAxios<SearchApiResponse>(
    {
      method: 'GET',
      params: { query },
      url: '/api/search/',
    },
    options,
  );
}

export { searchRetrieve };
export type { SearchApiResponse, SearchFulltextResult, SearchQueryType };
