#!/usr/bin/env node
/**
 * Sync local markdown posts to DynamoDB
 *
 * This script reads posts from content/posts/ and creates them in DynamoDB
 * if they don't already exist. This enables comments and unified tracking.
 *
 * Usage:
 *   ADMIN_TOKEN=xxx npm run sync-posts
 *
 * Or set ADMIN_TOKEN in .env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'content', 'posts');

// Load environment variables from .env.local if available
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    }
}

loadEnv();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://musings-mr.net';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

async function syncLocalPosts() {
    console.log('Starting local posts sync...');
    console.log(`API URL: ${API_URL}`);

    if (!fs.existsSync(POSTS_DIR)) {
        console.log('No local posts directory found at:', POSTS_DIR);
        return;
    }

    // Get existing posts from API
    console.log('Fetching existing posts...');
    let existingPosts = [];
    try {
        const response = await fetch(`${API_URL}/api/posts/`, {
            headers: { Accept: 'application/json' },
        });
        if (response.ok) {
            existingPosts = await response.json();
        } else {
            console.error('Failed to fetch existing posts:', response.status);
        }
    } catch (e) {
        console.error('Error fetching existing posts:', e.message);
    }

    const existingIds = new Set(existingPosts.map(p => p.id));
    console.log(`Found ${existingPosts.length} existing posts`);

    // Read local posts
    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const postDirs = entries.filter(entry => entry.isDirectory());

    console.log(`Found ${postDirs.length} local post directories`);

    for (const dir of postDirs) {
        const slug = dir.name;
        const indexPath = path.join(POSTS_DIR, slug, 'index.md');

        if (!fs.existsSync(indexPath)) {
            console.log(`  Skipping ${slug}: no index.md found`);
            continue;
        }

        const fileContents = fs.readFileSync(indexPath, 'utf-8');
        const { data, content } = matter(fileContents);

        const postId = data.id || `local-${slug}`;

        if (existingIds.has(postId)) {
            console.log(`  Skipping ${postId}: already exists in DynamoDB`);
            continue;
        }

        // Prepare post data
        const postData = {
            id: postId,
            title: data.title,
            snippet: data.snippet,
            content: content,
            category: data.category,
            date: data.date,
            author: data.author,
            imageUrl: data.imageUrl || null,
        };

        console.log(`  Creating post: ${postId}`);

        if (!ADMIN_TOKEN) {
            console.log('    WARNING: No ADMIN_TOKEN provided, skipping API call');
            continue;
        }

        try {
            const response = await fetch(`${API_URL}/api/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                console.log(`    Successfully created: ${postId}`);
            } else {
                const errorText = await response.text();
                console.error(`    Failed to create ${postId}: ${response.status}`);
                console.error(`    Error: ${errorText}`);
            }
        } catch (e) {
            console.error(`    Error creating ${postId}:`, e.message);
        }
    }

    console.log('Sync complete!');
}

syncLocalPosts().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
