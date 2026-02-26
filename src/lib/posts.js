import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function extractHeadings(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const headings = [];
    for (const line of lines) {
        if (line.startsWith('> ')) continue;
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) {
            headings.push({
                text: match[2].trim(),
                level: match[1].length,
                id: slugify(match[2].trim()),
            });
        }
    }
    return headings;
}

/**
 * Get all local markdown posts from content/posts directory
 */
/**
 * Ensure all values are JSON serializable (convert Date objects to strings)
 */
function serializeData(data) {
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof Date) {
            serialized[key] = value.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
            serialized[key] = value;
        }
    }
    return serialized;
}

/**
 * Get all local markdown posts from content/posts directory
 */
export function getLocalPosts() {
    if (!fs.existsSync(POSTS_DIR)) return [];

    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const postDirs = entries.filter(entry => entry.isDirectory());

    return postDirs.map(dir => {
        const slug = dir.name;
        const indexPath = path.join(POSTS_DIR, slug, 'index.md');

        if (!fs.existsSync(indexPath)) {
            console.warn(`No index.md found in ${slug}`);
            return null;
        }

        const fileContents = fs.readFileSync(indexPath, 'utf-8');
        const { data, content } = matter(fileContents);

        return {
            ...serializeData(data),
            id: data.id || `local-${slug}`,
            content,
            isLocalPost: true,
            slug,
        };
    }).filter(Boolean);
}

/**
 * Get a single local post by ID
 */
export function getLocalPost(id) {
    const slug = id.replace('local-', '');
    const indexPath = path.join(POSTS_DIR, slug, 'index.md');

    if (!fs.existsSync(indexPath)) return null;

    const fileContents = fs.readFileSync(indexPath, 'utf-8');
    const { data, content } = matter(fileContents);

    return {
        ...serializeData(data),
        id: data.id || `local-${slug}`,
        content,
        isLocalPost: true,
        slug,
    };
}

/**
 * Get all posts from both API and local sources
 */
export async function getAllPosts() {
    // Fetch API posts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/`;
    let apiPosts = [];

    try {
        const response = await fetch(apiUrl, {
            headers: { Accept: 'application/json' },
        });
        if (response.ok) {
            apiPosts = await response.json();
        }
    } catch (e) {
        console.error('Error fetching API posts:', e);
    }

    // Get local posts
    const localPosts = getLocalPosts();

    // Merge and sort by date (newest first)
    return [...apiPosts, ...localPosts].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );
}

/**
 * Get a single post by ID from either source
 */
export async function getPostById(postId) {
    // Check if local post
    if (postId.startsWith('local-')) {
        return getLocalPost(postId);
    }

    // Fetch from API
    const postUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`;
    try {
        const response = await fetch(postUrl, {
            headers: { Accept: 'application/json' },
        });
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error(`Error fetching post ${postId}:`, e);
    }

    return null;
}
