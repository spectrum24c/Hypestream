// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    alert('Please login first!');
    window.location.href = 'index.html';
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Movie data script
const apiKeys = {
  tmdb: "62c59007d93c96aa3cca9f3422d51af5",
  youtube: "AIzaSyDXm-Wl4rlMXXhS0hWxoJDMdsc3mllh_ok"
};

const tmdbApiEndpoint = "https://api.themoviedb.org/3";
const imgPath = "https://image.tmdb.org/t/p/original";

const apiPaths = {
  fetchAllCategories: `${tmdbApiEndpoint}/genre/movie/list?api_key=${apiKeys.tmdb}`,
  fetchMoviesList: (id) => `${tmdbApiEndpoint}/discover/movie?api_key=${apiKeys.tmdb}&with_genres=${id}`,
  fetchTrending: `${tmdbApiEndpoint}/trending/all/day?api_key=${apiKeys.tmdb}&language=en-US`,
  fetchPopularMovies: `${tmdbApiEndpoint}/movie/popular?api_key=${apiKeys.tmdb}&language=en-US`,
  fetchMovieDetails: (movieId) => `${tmdbApiEndpoint}/movie/${movieId}?api_key=${apiKeys.tmdb}&language=en-US`,
  fetchMovieTrailer: (movieId) => `${tmdbApiEndpoint}/movie/${movieId}/videos?api_key=${apiKeys.tmdb}&language=en-US`
};

// Favourite movies storage
const favouriteMovies = JSON.parse(localStorage.getItem('favouriteMovies')) || [];

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            }
        });
    }
}

// Notify user about new movies
function notifyNewMovies(newMovies) {
    newMovies.forEach(movie => {
        const title = movie.title || movie.name;
        const options = {
            body: `New movie available: ${title}`,
            icon: movie.poster_path ? `${imgPath}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster',
        };
        new Notification('New Movie Alert!', options);
    });
}

// Check for new movies
async function checkForNewMovies() {
    try {
        const res = await fetch(apiPaths.fetchTrending);
        const data = await res.json();
        const trendingMovies = data.results || [];
        const storedMovies = JSON.parse(localStorage.getItem('trendingMovies')) || [];

        const newMovies = trendingMovies.filter(movie => 
            !storedMovies.some(stored => stored.id === movie.id)
        );

        if (newMovies.length > 0) {
            notifyNewMovies(newMovies);
            localStorage.setItem('trendingMovies', JSON.stringify(trendingMovies));
        }
    } catch (err) {
        console.error('Error checking for new movies:', err);
    }
}

// Initialize the app
function init() {
    requestNotificationPermission();
    setInterval(checkForNewMovies, 3600000); // Check every hour
    fetchAndbuildMovieSection(apiPaths.fetchTrending, 'Trending Now');
    fetchAndbuildMovieSection(apiPaths.fetchPopularMovies, 'Popular Movies');
    fetchAndbuildMovieSection(apiPaths.fetchMoviesList(28), 'Action Movies');
    fetchAndbuildMovieSection(apiPaths.fetchMoviesList(35), 'Comedy Movies');
    fetchAndbuildMovieSection(apiPaths.fetchMoviesList(27), 'Horror Movies');
    fetchAndbuildMovieSection(apiPaths.fetchMoviesList(16), 'Animated Series');
    fetchAndbuildMovieSection(apiPaths.fetchMoviesList(12), 'Animations');
    buildFavouriteSection(); // Initialize Favourite category
}

// Build Favourite section
function buildFavouriteSection() {
    const moviesCont = document.getElementById('movies-cont');
    const favouriteSection = document.getElementById('favourite-section');

    if (favouriteMovies.length === 0) {
        favouriteSection.style.display = 'none';
        return;
    }

    favouriteSection.style.display = 'block';
    favouriteSection.innerHTML = `
        <div class="w-full">
            <h2 class="text-2xl font-bold mb-4">Favourites</h2>
            <div class="flex gap-8 overflow-x-auto pb-6 px-2 scroll-smooth">
                ${favouriteMovies.map(item => `
                    <div class="movie-item bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition duration-200 cursor-pointer flex-shrink-0 w-72" 
                         onclick="showMovieDetails('${item.id}', ${item.isTVShow})">
                        <img src="${item.posterPath}" alt="${item.title}" 
                             class="w-full h-96 object-cover">
                        <div class="p-4">
                            <h3 class="font-bold text-lg mb-2 truncate">${item.title}</h3>
                            <div class="flex justify-between text-gray-400 text-sm">
                                <span>${item.releaseDate}</span>
                                <span>★ ${item.voteAverage}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Add to Favourites
function addToFavourites(movieId, title, posterPath, releaseDate, voteAverage, isTVShow) {
    const movie = { id: movieId, title, posterPath, releaseDate, voteAverage, isTVShow };
    favouriteMovies.push(movie);
    localStorage.setItem('favouriteMovies', JSON.stringify(favouriteMovies));
    buildFavouriteSection();
    alert(`"${title}" has been added to your favourites!`);
    updateFavouriteButton(movieId, true);
}

// Remove from Favourites
function removeFromFavourites(movieId) {
    const index = favouriteMovies.findIndex(movie => movie.id === movieId);
    if (index !== -1) {
        const removedMovie = favouriteMovies.splice(index, 1)[0];
        localStorage.setItem('favouriteMovies', JSON.stringify(favouriteMovies));
        buildFavouriteSection();
        alert(`"${removedMovie.title}" has been removed from your favourites!`);
        updateFavouriteButton(movieId, false);
    }
}

// Update Favourite Button
function updateFavouriteButton(movieId, isFavourite) {
    const favouriteButton = document.getElementById('favourite-button');
    if (isFavourite) {
        favouriteButton.textContent = 'Remove from Favourite';
        favouriteButton.onclick = () => removeFromFavourites(movieId);
    } else {
        favouriteButton.textContent = 'Add to Favourite';
        favouriteButton.onclick = () => {
            const movie = favouriteMovies.find(movie => movie.id === movieId);
            if (movie) {
                addToFavourites(movie.id, movie.title, movie.posterPath, movie.releaseDate, movie.voteAverage, movie.isTVShow);
            }
        };
    }
}

// Fetch and build movie sections
async function fetchAndbuildMovieSection(fetchUrl, categoryName) {
  try {
    const res = await fetch(fetchUrl);
    const data = await res.json();
    const movies = data.results;
    if (Array.isArray(movies) && movies.length) {
      buildMoviesSection(movies, categoryName);
    }
  } catch (err) {
    console.error(err);
  }
}

// Build movies section
function buildMoviesSection(list, categoryName) {
    const moviesCont = document.getElementById('movies-cont');
    
    const moviesListHTML = list.map(item => {
        const title = item.title || item.name; // Handle both movies and series
        const posterPath = item.poster_path 
            ? `${imgPath}${item.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=No+Poster'; // Fallback for missing posters

        return `
        <div class="movie-item bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition duration-200 cursor-pointer flex-shrink-0 w-72" 
             onclick="showMovieDetails('${item.id}', ${item.media_type === 'tv'})">
            <img src="${posterPath}" alt="${title}" 
                 class="w-full h-96 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2 truncate">${title}</h3>
                <div class="flex justify-between text-gray-400 text-sm">
                    <span>${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</span>
                    <span>★ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
            </div>
        </div>`;
    }).join('');

    const moviesSectionHTML = `
        <div class="w-full">
            <h2 class="text-2xl font-bold mb-4">${categoryName}</h2>
            <div class="flex gap-8 overflow-x-auto pb-6 px-2 scroll-smooth">
                ${moviesListHTML}
            </div>
        </div>
    `;

    moviesCont.insertAdjacentHTML('beforeend', moviesSectionHTML);
}

// Show movie or series details
function showMovieDetails(movieId, isTVShow = false) {
    const fetchUrl = isTVShow 
        ? `${tmdbApiEndpoint}/tv/${movieId}?api_key=${apiKeys.tmdb}`
        : apiPaths.fetchMovieDetails(movieId);
        
    fetch(fetchUrl)
        .then(res => res.json())
        .then(item => {
            const playerContainer = document.querySelector('.player-container');
            const playerContent = playerContainer.querySelector('div');
            const title = item.title || item.name; // Handle both movies and series
            const releaseDate = item.release_date || item.first_air_date; // Handle both movies and series
            const runtime = isTVShow 
                ? `${item.number_of_seasons} Season(s)` 
                : `${item.runtime} min`; // Handle runtime or seasons
            const posterPath = item.poster_path ? imgPath + item.poster_path : 'https://via.placeholder.com/300x450?text=No+Poster';
            const voteAverage = item.vote_average?.toFixed(1) || 'N/A';
            const isFavourite = favouriteMovies.some(movie => movie.id === movieId);

            playerContent.innerHTML = `
                <button onclick="closePlayer()" 
                        class="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center z-10">
                    ✕
                </button>
                <div class="p-6">
                    <div class="flex flex-col md:flex-row gap-6">
                        <img src="${posterPath}" 
                             alt="${title}" 
                             class="w-full md:w-1/3 rounded-lg">
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold mb-2">${title}</h2>
                            <div class="flex gap-4 mb-4 text-gray-300">
                                <span>${releaseDate?.split('-')[0] || 'N/A'}</span>
                                <span>★ ${voteAverage}</span>
                                <span>${runtime}</span>
                            </div>
                            <p class="text-gray-300 mb-4">${item.overview || 'No description available'}</p>
                            <div class="flex flex-wrap gap-3">
                                <button onclick="playTrailer('${movieId}', ${isTVShow})" 
                                        class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                                    Watch Trailer
                                </button>
                                <button onclick="playStreaming('${movieId}', ${isTVShow})" 
                                        class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                                    Watch Now
                                </button>
                                <button id="favourite-button" 
                                        class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded">
                                    ${isFavourite ? 'Remove from Favourite' : 'Add to Favourite'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const favouriteButton = document.getElementById('favourite-button');
            favouriteButton.onclick = isFavourite
                ? () => removeFromFavourites(movieId)
                : () => addToFavourites(movieId, title, posterPath, releaseDate, voteAverage, isTVShow);
            playerContainer.style.display = 'flex';
        })
        .catch(err => console.error('Error fetching details:', err));
}

function closePlayer() {
    const playerContainer = document.querySelector('.player-container');
    const playerContent = playerContainer.querySelector('div');
    playerContent.innerHTML = ''; // Clear the content to reset the player-container
    playerContainer.style.display = 'none';
}

// Play streaming content
async function playStreaming(movieId, isTVShow = false, seriesName = '', seasonNumber = null, episodeNumber = null) {
    const streamingUrl = isTVShow 
        ? `https://vidsrc.xyz/embed/tv?tmdb=${movieId}&season=${seasonNumber}&episode=${episodeNumber}`
        : `https://vidsrc.in/embed/${movieId}`; // Use VidSrc API for streaming
    const streamingCont = document.getElementById('streaming-cont');
    streamingCont.innerHTML = `
        <button class="close-btn absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center"
                onclick="exitStreaming()">✕</button>
        <iframe id="movie-player-${movieId}" src="${streamingUrl}" width="100%" height="100%" frameborder="0" referrerpolicy="origin" allowfullscreen></iframe>
    `;
    streamingCont.style.display = 'flex';
}

function exitStreaming() {
    const streamingCont = document.getElementById('streaming-cont');
    streamingCont.style.display = 'none';
    streamingCont.innerHTML = '';
}

// Play trailer
async function playTrailer(movieId, isTVShow = false, seriesName = '') {
    const trailerUrl = isTVShow 
        ? `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${seriesName} trailer&key=${apiKeys.youtube}`
        : apiPaths.fetchMovieTrailer(movieId);
    try {
        const res = await fetch(trailerUrl);
        const data = await res.json();
        const trailer = isTVShow ? data.items[0] : data.results.find(video => video.type === 'Trailer');
        if (trailer) {
            const trailerContainer = document.querySelector('.trailer-container');
            trailerContainer.innerHTML = `
                <button class="close-btn absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center"
                        onclick="exitTrailer()">✕</button>
                <iframe id="trailer-player" src="https://www.youtube.com/embed/${trailer.id.videoId || trailer.key}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
            `;
            trailerContainer.style.display = 'flex';
        }
    } catch (err) {
        console.error(err);
    }
}

function exitTrailer() {
    const trailerContainer = document.querySelector('.trailer-container');
    trailerContainer.style.display = 'none';
    trailerContainer.innerHTML = '';
}

// Search functionality
function closeSearchResults() {
    document.getElementById('search-results-cont').style.display = 'none';
    document.getElementById('movieSearch').value = '';
}

function searchMoviesAndTVShows(query) {
    const tmdbMoviesUrl = `${tmdbApiEndpoint}/search/movie?api_key=${apiKeys.tmdb}&query=${encodeURIComponent(query)}`;
    const tmdbTVShowsUrl = `${tmdbApiEndpoint}/search/tv?api_key=${apiKeys.tmdb}&query=${encodeURIComponent(query)}`;

    Promise.all([fetch(tmdbMoviesUrl), fetch(tmdbTVShowsUrl)])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(data => {
            const movies = data[0].results || [];
            const tvShows = data[1].results || [];
            const combinedResults = [...movies, ...tvShows];
            displaySearchResults(combinedResults);
        })
        .catch(error => {
            console.error('Search error:', error);
        });
}

function displaySearchResults(results) {
    const resultsContent = document.getElementById('search-results-content');
    resultsContent.innerHTML = '';

    if (results.length === 0) {
        resultsContent.innerHTML = '<p class="text-center text-gray-400 py-4">No results found</p>';
        return;
    }

    const resultsHTML = results.map(item => {
        const posterPath = item.poster_path ? `${imgPath}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';
        const title = item.title || item.name;
        const isTVShow = item.media_type === 'tv' || item.first_air_date; // Check if it's a TV show
        return `
        <div class="movie-item bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition duration-200 cursor-pointer mb-4"
             onclick="showMovieDetails('${item.id}', ${isTVShow})">
            <img src="${posterPath}" alt="${title}" class="w-full h-64 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${title}</h3>
                <div class="flex justify-between text-gray-400 text-sm">
                    <span>${(item.release_date || item.first_air_date)?.split('-')[0] || 'N/A'}</span>
                    <span>★ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
            </div>
        </div>`;
    }).join('');

    resultsContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-6">Search Results</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${resultsHTML}
        </div>
    `;
}

const movieSearchInput = document.getElementById('movieSearch');
movieSearchInput.addEventListener('input', function (event) {
    const query = event.target.value.trim();
    const searchResultsCont = document.getElementById('search-results-cont');

    if (query.length > 2) { // Start searching after 3 characters
        searchMoviesAndTVShows(query);
        searchResultsCont.style.display = 'flex';
    } else {
        // Clear search results and hide the container when input is empty
        document.getElementById('search-results-content').innerHTML = '';
        searchResultsCont.style.display = 'none';
    }
});

document.getElementById('movieSearch').addEventListener('focus', function () {
    this.style.cursor = 'text'; // Ensure the cursor is set to text when focused
});

document.getElementById('movieSearch').addEventListener('blur', function () {
    this.style.cursor = 'default'; // Reset the cursor when focus is lost
});

document.getElementById('search-results-cont').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSearchResults();
    }
});

// Initialize the app
window.addEventListener('load', init);