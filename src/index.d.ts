export interface TaglifyResult {
    text: string;
    changed: boolean;
}
/**
 * Replaces content between HTML comment markers.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 */
export declare function taglifyText(text: string, tags: Record<string, string>): TaglifyResult;
/**
 * Applies tag replacements to a file.
 *
 * Returns true if the file was modified.
 * Throws a friendly error if the file does not exist.
 */
export declare function taglifyFile(filePath: string, tags: Record<string, string>): boolean;
