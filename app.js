const API = 'https://hacker-news.firebaseio.com/v0';
let storyIDs = [];
let jobIDs = [];
let storyIndex = 0;
let jobIndex = 0;
let postCache = [];
let loadedPosts = [];
let newPostIDs = [];

const postsContainer = document.getElementById('posts-container');
const loadMoreButton = document.getElementById('load-more');
const liveUpdateBar = document.getElementById('live-update-bar');

async function fetchJSON(url) {
  const res = await fetch(url);
  return await res.json();
}

async function loadInitialPosts() {
  storyIDs = await fetchJSON(`${API}/newstories.json`);
  jobIDs = await fetchJSON(`${API}/jobstories.json`);
  await fillPostCache();
  loadNextPosts();
  setInterval(checkForUpdates, 5000);
}

async function fillPostCache() {
  const chunkSize = 20;
  const storyChunk = storyIDs.slice(storyIndex, storyIndex + chunkSize);
  const jobChunk = jobIDs.slice(jobIndex, jobIndex + chunkSize);
  storyIndex += chunkSize;
  jobIndex += chunkSize;
  const posts = await Promise.all([...storyChunk, ...jobChunk].map(id => fetchJSON(`${API}/item/${id}.json`)));
  postCache = postCache.concat(posts.filter(p => p));
  postCache.sort((a, b) => b.time - a.time);
}

async function loadNextPosts() {
  if (postCache.length < 10 && (storyIndex < storyIDs.length || jobIndex < jobIDs.length)) {
    await fillPostCache();
  }
  const nextPosts = postCache.splice(0, 10);
  nextPosts.forEach(post => {
    loadedPosts.push(post.id);
    postsContainer.appendChild(createPostElement(post));
  });
}

function createPostElement(post) {
  const el = document.createElement('div');
  el.className = 'post';
  el.innerHTML = `
    <h3>${post.title || '[No title]'} <small>(${post.type})</small></h3>
    <p>by ${post.by} | ${new Date(post.time * 1000).toLocaleString()}</p>
    ${post.url ? `<a href="${post.url}" target="_blank">Read more</a>` : ''}
    ${post.text ? `<p>${post.text}</p>` : ''}
    <button onclick="toggleComments(${post.id}, this)">💬 Show Comments</button>
    <div class="comments" id="comments-${post.id}"></div>
  `;
  return el;
}

async function toggleComments(postId, btn) {
  const container = document.getElementById(`comments-${postId}`);
  if (container.innerHTML !== '') {
    container.innerHTML = '';
    btn.textContent = '💬 Show Comments';
    return;
  }

  const post = await fetchJSON(`${API}/item/${postId}.json`);
  if (post.kids) {
    const commentItems = await Promise.all(post.kids.map(id => fetchJSON(`${API}/item/${id}.json`)));
    commentItems
      .filter(c => c && !c.deleted)
      .sort((a, b) => b.time - a.time)
      .forEach(c => renderComment(c, container));
  }
  btn.textContent = '🗙 Hide Comments';
  return;
}

function renderComment(comment, container, level = 0) {
  if (!comment || comment.deleted) return;

  const el = document.createElement('div');
  el.className = 'comment';
  el.style.marginLeft = `${level * 20}px`;
  el.innerHTML = `
    <p><strong>${comment.by || '[deleted]'}</strong> - ${new Date(comment.time * 1000).toLocaleString()}</p>
    <p>${comment.text || ''}</p>
  `;
  container.appendChild(el);

  if (comment.kids) {
    comment.kids.forEach(async id => {
      const reply = await fetchJSON(`${API}/item/${id}.json`);
      renderComment(reply, container, level + 1);
    });
  }
}

async function checkForUpdates() {
  const [latestStoryIDs, latestJobIDs] = await Promise.all([
    fetchJSON(`${API}/newstories.json`),
    fetchJSON(`${API}/jobstories.json`)
  ]);
  const latestIDs = [...latestStoryIDs, ...latestJobIDs];
  const fresh = latestIDs.filter(id => !loadedPosts.includes(id) && !newPostIDs.includes(id));
  if (fresh.length > 0) {
    newPostIDs = fresh;
    liveUpdateBar.classList.remove('hidden');
  }
}

async function showNewPosts() {
  const items = await Promise.all(newPostIDs.slice(0, 10).map(id => fetchJSON(`${API}/item/${id}.json`)));
  items
    .filter(p => p)
    .sort((a, b) => b.time - a.time)
    .forEach(post => {
      loadedPosts.unshift(post.id);
      const postEl = createPostElement(post);
      postsContainer.prepend(postEl);
    });
  newPostIDs = [];
  liveUpdateBar.classList.add('hidden');
}

loadMoreButton.addEventListener('click', loadNextPosts);
loadInitialPosts();
