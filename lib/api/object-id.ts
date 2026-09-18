const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i

/** True for a syntactically valid 24-character hex MongoDB ObjectId string. */
export function isValidObjectId(id: string): boolean {
  return OBJECT_ID_REGEX.test(id)
}
