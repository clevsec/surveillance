
// Firebase references
const db = firebase.firestore();
const storage = firebase.storage();

// Login function
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => alert('Login failed: ' + error.message));
}

// Logout function
function logout() {
  firebase.auth().signOut();
}

// Add article function
function addArticle() {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const category = document.getElementById('category').value;
  const youtubeUrl = document.getElementById('youtube-url').value;
  const mediaFile = document.getElementById('media').files[0];

  if (!title || !content || !category) {
    alert('Title, content, and category are required!');
    return;
  }

  const articleData = {
    title: title,
    content: content,
    category: category,
    youtubeUrl: youtubeUrl || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (mediaFile) {
    const storageRef = storage.ref(`media/${mediaFile.name}`);
    storageRef.put(mediaFile).then((snapshot) => {
      snapshot.ref.getDownloadURL().then((url) => {
        articleData.mediaUrl = url;
        articleData.mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'file';
        saveArticle(articleData);
      });
    });
  } else {
    saveArticle(articleData);
  }
}

function saveArticle(articleData) {
  db.collection('articles').add(articleData)
    .then(() => {
      alert('Article added successfully!');
      document.getElementById('title').value = '';
      document.getElementById('content').value = '';
      document.getElementById('category').value = 'ip-cameras';
      document.getElementById('youtube-url').value = '';
      document.getElementById('media').value = '';
    })
    .catch((error) => alert('Error adding article: ' + error.message));
}

// Load articles function
function loadArticles(category) {
  const articlesDiv = document.getElementById('articles');
  let query = db.collection('articles').orderBy('createdAt', 'desc');
  if (category !== 'all') {
    query = query.where('category', '==', category);
  }
  query.onSnapshot((snapshot) => {
    articlesDiv.innerHTML = '';
    snapshot.forEach((doc) => {
      const article = doc.data();
      const articleElement = document.createElement('div');
      articleElement.className = 'article';
      articleElement.innerHTML = `
        <h2>${article.title}</h2>
        <p><strong>Category:</strong> ${article.category.replace('-', ' ').toUpperCase()}</p>
        <p>${article.content}</p>
        ${article.youtubeUrl ? `<iframe width="560" height="315" src="${article.youtubeUrl.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` : ''}
        ${article.mediaUrl && article.mediaType === 'image' ? `<img src="${article.mediaUrl}" alt="Article Image">` : ''}
        ${article.mediaUrl && article.mediaType === 'file' ? `<a href="${article.mediaUrl}" target="_blank">Download File</a>` : ''}
        <div class="comments">
          <h3>Comments (Read-Only)</h3>
          <div id="comments-${doc.id}"></div>
        </div>
      `;
      articlesDiv.appendChild(articleElement);
      loadComments(doc.id);
    });
  });
}

// Load comments (read-only for non-admins)
function loadComments(articleId) {
  db.collection('articles').doc(articleId).collection('comments').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    const commentsDiv = document.getElementById(`comments-${articleId}`);
    commentsDiv.innerHTML = '';
    snapshot.forEach((doc) => {
      const comment = doc.data();
      const commentElement = document.createElement('div');
      commentElement.innerHTML = `<p><strong>Anonymous:</strong> ${comment.text}</p>`;
      commentsDiv.appendChild(commentElement);
    });
  });
}

// Search articles
function searchArticles() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const articlesDiv = document.getElementById('articles');
  db.collection('articles').orderBy('createdAt', 'desc').get().then((snapshot) => {
    articlesDiv.innerHTML = '';
    snapshot.forEach((doc) => {
      const article = doc.data();
      if (article.title.toLowerCase().includes(searchTerm) || article.content.toLowerCase().includes(searchTerm)) {
        const articleElement = document.createElement('div');
        articleElement.className = 'article';
        articleElement.innerHTML = `
          <h2>${article.title}</h2>
          <p><strong>Category:</strong> ${article.category.replace('-', ' ').toUpperCase()}</p>
          <p>${article.content}</p>
          ${article.youtubeUrl ? `<iframe width="560" height="315" src="${article.youtubeUrl.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` : ''}
          ${article.mediaUrl && article.mediaType === 'image' ? `<img src="${article.mediaUrl}" alt="Article Image">` : ''}
          ${article.mediaUrl && article.mediaType === 'file' ? `<a href="${article.mediaUrl}" target="_blank">Download File</a>` : ''}
          <div class="comments">
            <h3>Comments (Read-Only)</h3>
            <div id="comments-${doc.id}"></div>
          </div>
        `;
        articlesDiv.appendChild(articleElement);
        loadComments(doc.id);
      }
    });
  });
}

// Filter articles by category
function filterArticles(category) {
  loadArticles(category);
}
