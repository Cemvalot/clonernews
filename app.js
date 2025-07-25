class HackerNewsApp {
    constructor() {
        this.API_BASE = 'https://hacker-news.firebaseio.com/v0';
        this.POSTS_PER_PAGE = 20;
        this.posts = [];
        this.currentPage = 0;
        this.currentCategory = 'topstories';
        this.isLoading = false;
        this.isLoadingMore = false;
        this.liveUpdates = [];
        this.lastUpdateTime = new Date();
        this.lastRequestTime = 0;
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.loadPosts();
        this.startLiveUpdates();
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Load more button
        document.getElementById('load-more').addEventListener('click', () => {
            this.loadMorePosts();
        });

        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this.closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Simple rate limiting - 200ms between requests
    async fetchWithRateLimit(url) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < 200) {
            await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    async fetchItem(id) {
        return await this.fetchWithRateLimit(`${this.API_BASE}/item/${id}.json`);
    }

    async fetchStoryIds(category = 'topstories') {
        const result = await this.fetchWithRateLimit(`${this.API_BASE}/${category}.json`);
        return result || [];
    }

    // Throttle function for live updates (5 seconds)
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return (...args) => {
            const currentTime = Date.now();
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Post Loading Methods
    async loadPosts(append = false) {
        if (this.isLoading) return;
        
        if (!append) {
            this.isLoading = true;
            this.showLoading(true);
            this.currentPage = 0;
            this.posts = [];
        } else {
            this.isLoadingMore = true;
            this.showLoadMoreLoading(true);
            this.currentPage++;
        }

        try {
            const storyIds = await this.fetchStoryIds(this.currentCategory);
            const startIndex = this.currentPage * this.POSTS_PER_PAGE;
            const endIndex = startIndex + this.POSTS_PER_PAGE;
            const pageIds = storyIds.slice(startIndex, endIndex);

            const postPromises = pageIds.map(id => this.fetchItem(id));
            const fetchedPosts = await Promise.all(postPromises);
            const validPosts = fetchedPosts.filter(post => post && !post.deleted);

            // Sort by time (newest first)
            validPosts.sort((a, b) => b.time - a.time);

            if (append) {
                this.posts = [...this.posts, ...validPosts];
            } else {
                this.posts = validPosts;
            }

            this.renderPosts();
            this.showLoadMoreButton(endIndex < storyIds.length);

        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            this.isLoading = false;
            this.isLoadingMore = false;
            this.showLoading(false);
            this.showLoadMoreLoading(false);
        }
    }

    loadMorePosts() {
        this.loadPosts(true);
    }

    switchCategory(category) {
        if (category === this.currentCategory) return;
        
        this.currentCategory = category;
        
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        this.loadPosts();
    }

    // Rendering Methods
    renderPosts() {
        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'post-item';
        div.addEventListener('click', () => this.openPost(post));

        const postType = this.getPostType(post);
        const timeAgo = this.getTimeAgo(post.time);
        const domain = this.extractDomain(post.url);

        div.innerHTML = `
            <div class="post-header">
                <span class="post-type ${postType.toLowerCase()}">${postType}</span>
                <span class="post-score">⬆ ${post.score || 0}</span>
            </div>
            <div class="post-title">${this.escapeHtml(post.title || 'No title')}</div>
            ${post.url ? `<div class="post-url">${domain}</div>` : ''}
            <div class="post-meta">
                <span>👤 ${post.by || 'Unknown'}</span>
                <span>🕒 ${timeAgo}</span>
                <span>💬 ${post.descendants || 0} comments</span>
            </div>
        `;

        return div;
    }

    getPostType(post) {
        if (post.type === 'job') return 'Job';
        if (post.type === 'poll') return 'Poll';
        return 'Story';
    }

    extractDomain(url) {
        if (!url) return '';
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    getTimeAgo(timestamp) {
        const now = Date.now() / 1000;
        const diff = now - timestamp;
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Modal Methods
    async openPost(post) {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('modal-title').textContent = post.title || 'No title';
        
        const metaDiv = document.getElementById('modal-meta');
        const timeAgo = this.getTimeAgo(post.time);
        metaDiv.innerHTML = `
            <div class="post-meta">
                <span>👤 ${post.by || 'Unknown'}</span>
                <span>🕒 ${timeAgo}</span>
                <span>⬆ ${post.score || 0} points</span>
                <span>💬 ${post.descendants || 0} comments</span>
            </div>
        `;

        const contentDiv = document.getElementById('modal-content');
        if (post.text) {
            contentDiv.innerHTML = `<div style="margin-bottom: 20px;">${post.text}</div>`;
        } else if (post.url) {
            contentDiv.innerHTML = `<div style="margin-bottom: 20px;"><a href="${post.url}" target="_blank" style="color: #ff6600;">🔗 ${post.url}</a></div>`;
        } else {
            contentDiv.innerHTML = '';
        }

        // Load comments - simple approach
        if (post.kids && post.kids.length > 0) {
            this.loadComments(post.kids);
        } else {
            document.getElementById('comments-container').innerHTML = '<div class="no-updates">No comments yet.</div>';
            document.querySelector('.comments-loading').style.display = 'none';
        }
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        document.getElementById('comments-container').innerHTML = '';
        document.querySelector('.comments-loading').style.display = 'flex';
    }

    // Simple comment loading - just the direct replies
    async loadComments(commentIds) {
        const container = document.getElementById('comments-container');
        container.innerHTML = '';

        try {
            const commentPromises = commentIds.map(id => this.fetchItem(id));
            const comments = await Promise.all(commentPromises);
            const validComments = comments.filter(comment => comment && !comment.deleted);

            // Sort by time (newest first)
            validComments.sort((a, b) => b.time - a.time);

            for (const comment of validComments) {
                const commentElement = this.createCommentElement(comment);
                container.appendChild(commentElement);
            }

            document.querySelector('.comments-loading').style.display = 'none';
        } catch (error) {
            console.error('Error loading comments:', error);
            container.innerHTML = '<div class="no-updates">Error loading comments.</div>';
            document.querySelector('.comments-loading').style.display = 'none';
        }
    }

    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment';

        const timeAgo = this.getTimeAgo(comment.time);
        const hasReplies = comment.kids && comment.kids.length > 0;

        div.innerHTML = `
            <div class="comment-content">
                <div class="comment-meta">
                    ${hasReplies ? `<button class="comment-toggle" title="Click to expand ${comment.kids.length} replies">▶ ${comment.kids.length} replies</button>` : ''}
                    👤 ${comment.by || 'Unknown'} • 🕒 ${timeAgo}
                </div>
                <div class="comment-text">${comment.text || 'Comment removed'}</div>
                <div class="comment-replies" style="display: none;"></div>
            </div>
        `;

        if (hasReplies) {
            const toggleBtn = div.querySelector('.comment-toggle');
            const repliesDiv = div.querySelector('.comment-replies');
            let repliesLoaded = false;

            // Make the toggle button more prominent
            toggleBtn.style.cssText = `
                background: #ff6600;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                margin-right: 8px;
            `;

            toggleBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                if (repliesDiv.style.display === 'none') {
                    repliesDiv.style.display = 'block';
                    toggleBtn.innerHTML = `▼ Hide ${comment.kids.length} replies`;
                    toggleBtn.title = `Click to hide ${comment.kids.length} replies`;
                    
                    if (!repliesLoaded) {
                        repliesDiv.innerHTML = '<div class="loading"><div class="spinner small"></div><span>Loading replies...</span></div>';
                        
                        try {
                            const replyPromises = comment.kids.map(id => this.fetchItem(id));
                            const replies = await Promise.all(replyPromises);
                            const validReplies = replies.filter(reply => reply && !reply.deleted);
                            
                            repliesDiv.innerHTML = '';
                            validReplies.sort((a, b) => b.time - a.time);
                            
                            for (const reply of validReplies) {
                                const replyElement = this.createCommentElement(reply);
                                repliesDiv.appendChild(replyElement);
                            }
                            
                            repliesLoaded = true;
                        } catch (error) {
                            console.error('Error loading replies:', error);
                            repliesDiv.innerHTML = '<div class="no-updates">Failed to load replies. <button onclick="this.parentElement.parentElement.style.display=\'none\'; this.parentElement.parentElement.previousElementSibling.querySelector(\'.comment-toggle\').innerHTML=\'▶ ' + comment.kids.length + ' replies\';">Close</button></div>';
                        }
                    }
                } else {
                    repliesDiv.style.display = 'none';
                    toggleBtn.innerHTML = `▶ ${comment.kids.length} replies`;
                    toggleBtn.title = `Click to expand ${comment.kids.length} replies`;
                }
            });

            // Also make the entire comment clickable for expanding
            const commentContent = div.querySelector('.comment-content');
            commentContent.style.cursor = 'pointer';
            commentContent.addEventListener('click', (e) => {
                // Only trigger if not clicking on the button itself
                if (e.target !== toggleBtn) {
                    toggleBtn.click();
                }
            });
        }

        return div;
    }

    // Live Updates - throttled to 5 seconds
    startLiveUpdates() {
        this.throttledLiveUpdate = this.throttle(() => {
            this.updateLiveData();
        }, 5000); // 5 second throttle
        
        this.throttledLiveUpdate();
        setInterval(() => {
            this.throttledLiveUpdate();
        }, 5000);
    }

    async updateLiveData() {
        try {
            const newStoryIds = await this.fetchStoryIds('newstories');
            const recentIds = newStoryIds.slice(0, 10);
            
            const postPromises = recentIds.map(id => this.fetchItem(id));
            const newPosts = await Promise.all(postPromises);
            const validNewPosts = newPosts.filter(post => post && !post.deleted);
            
            const unseenPosts = validNewPosts.filter(newPost => 
                !this.liveUpdates.some(existing => existing.id === newPost.id)
            );
            
            if (unseenPosts.length > 0) {
                this.liveUpdates = [...unseenPosts, ...this.liveUpdates].slice(0, 20);
                this.renderLiveUpdates();
                this.lastUpdateTime = new Date();
                this.updateLastUpdateTime();
            }
            
        } catch (error) {
            console.error('Error updating live data:', error);
        }
    }

    renderLiveUpdates() {
        const container = document.getElementById('live-updates');
        
        if (this.liveUpdates.length === 0) {
            container.innerHTML = '<div class="no-updates">No new updates</div>';
            return;
        }

        container.innerHTML = '';
        this.liveUpdates.forEach(post => {
            const div = document.createElement('div');
            div.className = 'live-update-item';
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => this.openPost(post));
            
            const timeAgo = this.getTimeAgo(post.time);
            div.innerHTML = `
                <div class="live-update-title">${this.escapeHtml(post.title || 'No title')}</div>
                <div class="live-update-time">${timeAgo} • ${post.score || 0} points</div>
            `;
            
            container.appendChild(div);
        });
    }

    updateLastUpdateTime() {
        const timeString = this.lastUpdateTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('last-update').textContent = timeString;
    }

    // UI Helper Methods
    showLoading(show) {
        document.getElementById('main-loading').style.display = show ? 'flex' : 'none';
        document.getElementById('posts-container').style.display = show ? 'none' : 'block';
    }

    showLoadMoreButton(show) {
        document.getElementById('load-more').style.display = show ? 'block' : 'none';
    }

    showLoadMoreLoading(show) {
        const button = document.getElementById('load-more');
        const text = button.querySelector('.load-more-text');
        const spinner = button.querySelector('.spinner');
        
        if (show) {
            text.style.display = 'none';
            spinner.style.display = 'block';
            button.disabled = true;
        } else {
            text.style.display = 'block';
            spinner.style.display = 'none';
            button.disabled = false;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HackerNewsApp();
});