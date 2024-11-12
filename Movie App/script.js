const apiKey = "YOUR_API_KEY";
const apiUrl = 'https://api.themoviedb.org/3';

const searchBar = document.getElementById('search-bar');
const moviesGrid = document.getElementById('movies-grid');
const watchlistGrid = document.getElementById('watchlist-grid');
const modal = document.getElementById('movie-modal');
const movieDetails = document.getElementById('movie-details');
const closeModal = document.getElementById('close-modal');
const sortSelect = document.getElementById('sort-select');
const suggestions = document.getElementById('suggestions');
const starRating = document.getElementById('star-rating');
const stars = starRating.querySelectorAll('.star');

searchBar.addEventListener('input', handleSearch);
sortSelect.addEventListener('change', handleSortChange);
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', closeModalIfClickedOutside);
/**
 * Когда страница загружена, показываем страницу поиска и загружаем фильмы
 */
document.addEventListener("DOMContentLoaded", () => {
    showPage('search');
    fetchMovies();
    searchBar.addEventListener('input', handleSearch);
});
/**
 * Функция для закрытия модального окна
 */
function closeModalIfClickedOutside(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
/**
 * Функция для переключения между страницами
 */
function showPage(page) {
    document.getElementById('search-page').style.display = 'none';
    document.getElementById('watchlist-page').style.display = 'none';
    document.getElementById(page + '-page').style.display = 'block';
    searchBar.value = '';
    moviesGrid.innerHTML = '';
    watchlistGrid.innerHTML = '';

    if (page === 'watchlist') {
        loadWatchlistMovies();
    } else if (page === 'search') {
        fetchMovies('popularity.desc');
    }
}
/**
 * Функция для показа уведомлений
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
/**
 * Функция для получения фильмов c исползыванием сортировки по популярности
 */
function fetchMovies(sortBy = 'popularity.desc') {
    fetch(`${apiUrl}/discover/movie?api_key=${apiKey}&sort_by=${sortBy}`)
        .then(response => response.json())
        .then(data => displayMovies(data.results))
        .catch(error => console.error('Error fetching movies:', error));
}
/**
 * Функция для отработки изменения сортировки
 */
function handleSortChange() {
    const sortBy = sortSelect.value;
    const currentPage = document.getElementById('search-page').style.display === 'block' ? 'search' : 'watchlist';
    if (currentPage === 'search') {
        fetchMovies(sortBy);
    } else {
        loadWatchlistMovies(sortBy);
    }
}
/**
 * Функция для отработки поиска
 */
function handleSearch() {
    const query = searchBar.value.trim();
    const currentPage = document.getElementById('search-page').style.display === 'block' ? 'search' : 'watchlist';
    
    if (query) {
        if (currentPage === 'search') {
            searchMovies(query);
        } else {
            filterWatchlistMovies(query);
        }
    } else {
        if (currentPage === 'search') {
            fetchMovies();
        } else {
            loadWatchlistMovies();
        }
    }
}
/**
 * Функция для поиска фильмов по запросу
 */
function searchMovies(query) {
    fetch(`${apiUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length === 0) {
                moviesGrid.innerHTML = '<p>No movies found. Please try another search.</p>';
            } else {
                displayMovies(data.results);
            }
        })
        .catch(error => console.error('Error during search:', error));
}
/**
 * Функция для фильтрации фильмов в списке "Watchlist"
 */
function filterWatchlistMovies(query) {
    const watchlistMovies = getWatchlist();
    const filteredMovies = watchlistMovies.filter(movie => movie.title.toLowerCase().includes(query.toLowerCase()));
    if (filteredMovies.length === 0) {
        watchlistGrid.innerHTML = '<p>No movies found in your watchlist for this search.</p>';
    } else {
        displayMovies(filteredMovies, true);
    }
}
/**
 * Функция для получения списка фильмов из локального хранилища
 */
function getWatchlist() {
    return JSON.parse(localStorage.getItem('watchlist')) || [];
}
/**
 * Функция для сохранения списка фильмов в локальное хранилище
 */
function saveWatchlist(watchlist) {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}
/**
 * Функция для добавления/удаления фильмов из списка Watchlist
 */
function toggleWatchlist(movie) {
    const watchlist = getWatchlist();
    const index = watchlist.findIndex(item => item.id === movie.id);
    
    if (index === -1) {
        watchlist.push(movie);
        showNotification(`${movie.title} added to Watchlist`);
    } else {
        watchlist.splice(index, 1);
        showNotification(`${movie.title} removed from Watchlist`);
    }
    saveWatchlist(watchlist);
    displayMovies(watchlist, true);
}
/**
 *  Функция для проверки, находится ли фильм в списке Watchlist
*/
function isInWatchlist(movieId) {
    return getWatchlist().some(movie => movie.id === movieId);
}
/**
 *  Функция для создания карточки фильма
*/
function createMovieCard(movie, isWatchlist = false) {
    const div = document.createElement('div');
    div.classList.add('movie-card');
    const rating = Math.round(movie.vote_average * 10);
    const ratingColor = rating < 50 ? '#e74c3c' : rating <= 75 ? '#f39c12' : '#28a745';

    div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <div class="rating-circle" style="background-color: ${ratingColor};">${rating}%</div>
        <h3>${movie.title}</h3>
        <p>Release Date: ${movie.release_date}</p>
        <button class="watchlist-btn">${isInWatchlist(movie.id) ? '★ Remove from Watchlist' : '☆ Add to Watchlist'}</button>
    `;
    div.querySelector('.watchlist-btn').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleWatchlist(movie);
    });
    div.addEventListener('click', () => fetchMovieDetails(movie.id));

    return div;
}
/*
 * Функция для отображения фильмов
*/
function displayMovies(movies, isWatchlist = false) {
    const grid = isWatchlist ? watchlistGrid : moviesGrid;
    grid.innerHTML = '';
    if (movies.length === 0) {
        grid.innerHTML = '<p>No movies available based on your search.</p>';
        return;
    }
    movies.forEach(movie => {
        const card = createMovieCard(movie, isWatchlist);
        grid.appendChild(card);
    });
}
/*
 * Функция для получения и отображения подробной информации о фильме
*/
function fetchMovieDetails(movieId) {
    fetch(`${apiUrl}/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,videos,reviews`)
        .then(response => response.json())
        .then(movie => showModal(movie))
        .catch(error => console.error('Error fetching movie details:', error));
}
/*
 * Функция для отображения информации о фильме в модальном окне
*/

function showModal(movie) {
    movieDetails.innerHTML = `
        <h2>${movie.title}</h2>
        <p>${movie.overview}</p>
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
        <p><strong>Rating:</strong> ${movie.vote_average}</p>
        <p><strong>Runtime:</strong> ${movie.runtime} minutes</p>
        <p><strong>Release Date:</strong> ${movie.release_date}</p>
        <ul>
            ${movie.credits.cast.slice(0, 5).map(cast => `<li>${cast.name} as ${cast.character}</li>`).join('')}
        </ul>
    `;
    const movieTrailer = document.getElementById('movie-trailer');
    const trailer = movie.videos?.results.find(video => video.type === 'Trailer');
    movieTrailer.innerHTML = trailer
        ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
        : '<p>No trailer available.</p>';
    modal.style.display = 'flex';
}
/*
 * Функция для загрузки фильмов из списка Watchlist
*/
function loadWatchlistMovies(sortBy = 'popularity.desc') {
    const watchlistMovies = getWatchlist();
    if (watchlistMovies.length === 0) {
        watchlistGrid.innerHTML = "<p>Your watchlist is empty!</p>";
        return;
    }
    fetchMoviesWithSort(watchlistMovies, sortBy, true);
}
/*
 * Функция для сортировки списка фильмов по различным критериям.
*/
function fetchMoviesWithSort(movies, sortBy, isWatchlist) {
    if (sortBy === 'popularity.asc') {
        movies.sort((a, b) => a.popularity - b.popularity);
    } else if (sortBy === 'popularity.desc') {
        movies.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === 'release_date.asc') {
        movies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
    } else if (sortBy === 'release_date.desc') {
        movies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    }

    displayMovies(movies, isWatchlist);
}
/*
 *  Функция для выделения звезд на основе выбранного рейтинга.
*/
function highlightStars(rating, permanent = false) {
    stars.forEach(star => {
        if (star.getAttribute('data-value') <= rating) {
            star.classList.add('highlighted');
            if (permanent) star.classList.add('selected');
        } else {
            star.classList.remove('highlighted');
            if (!permanent) star.classList.remove('selected');
        }
    });
}
/*
 *  Функция для сброса выделения звезд. Убирает класс 'highlighted' с тех звезд, которые не были выбраны. 
*/
function resetStars() {
    stars.forEach(star => {
        if (!star.classList.contains('selected')) {
            star.classList.remove('highlighted');
        }
    });
}
/*
 * Добавление обработчиков событий для каждой звезды:
*/ 
stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.getAttribute('data-value')));
    star.addEventListener('mouseout', resetStars);
    star.addEventListener('click', () => highlightStars(star.getAttribute('data-value'), true));
});
