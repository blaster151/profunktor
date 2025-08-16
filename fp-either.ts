export {
  Either,
  Left as left,
  Right as right,
  foldEither,
  mapEither,
  chainEither,
  bimapEither,
  mapLeft as mapLeftEither,
} from './fp-either-unified';

// Provide getOrElse via ops-table alias
export { eitherGetOrElse as getOrElse } from './fp-either-ops-table';
