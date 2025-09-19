// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';

// prettier-ignore
import type { getConfig as File_Index_getConfig } from './pages/index';
// prettier-ignore
import type { getConfig as File_AlbumId_getConfig } from './pages/album/[id]';
// prettier-ignore
import type { getConfig as File_About_getConfig } from './pages/about';

// prettier-ignore
type Page =
| ({ path: '/' } & GetConfigResponse<typeof File_Index_getConfig>)
| { path: '/album'; render: 'dynamic' }
| ({ path: '/album/[id]' } & GetConfigResponse<typeof File_AlbumId_getConfig>)
| ({ path: '/about' } & GetConfigResponse<typeof File_About_getConfig>);

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
