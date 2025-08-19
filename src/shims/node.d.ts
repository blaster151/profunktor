/**
 * Node.js shims for browser builds
 * 
 * These declarations allow TypeScript compilation when Node.js modules
 * are imported but not available in the target environment.
 */

declare module 'fs' {
  const anyExport: any;
  export = anyExport;
}

declare module 'events' {
  export const EventEmitter: any;
  export default EventEmitter;
  export const once: any;
}

declare module 'path' {
  const anyExport: any;
  export = anyExport;
}

declare module 'util' {
  const anyExport: any;
  export = anyExport;
}
