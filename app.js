const API = 'https://hacker-news.firebaseio.com/v0';
let postIDs = [];
let currentIndex = 0;
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
  postIDs = await fetchJSON(`${API}/newstories.json`);
  loadNextPosts();
  setInterval(checkForUpdates, 5000);
}

async function loadNextPosts() {
  const nextIDs = postIDs.slice(currentIndex, currentIndex + 10);
  const posts = await Promise.all(nextIDs.map(id => fetchJSON(`${API}/item/${id}.json`)));

  posts.forEach(post => {
    if (post) {
      loadedPosts.push(post.id);
      postsContainer.appendChild(createPostElement(post));
    }
  });

  currentIndex += 10;
}

function createPostElement(post) {
  const el = document.createElement('div');
  el.className = 'post';
  el.innerHTML = `
    <h3>${post.title || '[No title]'}</h3>
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
  const latestIDs = await fetchJSON(`${API}/newstories.json`);
  const newIDs = latestIDs.filter(id => !loadedPosts.includes(id));
  if (newIDs.length > 0) {
    newPostIDs = newIDs;
    liveUpdateBar.classList.remove('hidden');
  }
}

async function showNewPosts() {
  const posts = await Promise.all(newPostIDs.slice(0, 10).map(id => fetchJSON(`${API}/item/${id}.json`)));
  posts.reverse().forEach(post => {
    if (post) {
      loadedPosts.unshift(post.id);
      const postEl = createPostElement(post);
      postsContainer.prepend(postEl);
    }
  });
  newPostIDs = [];
  liveUpdateBar.classList.add('hidden');
}

loadMoreButton.addEventListener('click', loadNextPosts);
loadInitialPosts();