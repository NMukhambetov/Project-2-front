const apiKey = "YOUR_API_KEY";
let isCelsius = true;
const unitToggle = document.getElementById('unit-toggle');
const searchInput = document.getElementById('search-input');
const addButton = document.querySelector('.add-button');

/*
* Переключение между градусами
*/
unitToggle.addEventListener('click', () => {
  isCelsius = !isCelsius;
  const city = document.getElementById('city').innerText;
  fetchWeatherData(city);
});

/*
* Получение данных о погоде при нажатии клавиши Enter
*/
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value;
    fetchWeatherData(city);
  }
});

/*
* Получение данных о погоде по геолокации при нажатии кнопки
*/
addButton.addEventListener('click', () => {
  getGeolocation();
});

/** 
 * Получает геолокацию пользователя и вызывает fetchWeatherDataByCoords для получения данных о погоде 
*/
function getGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        fetchWeatherDataByCoords(latitude, longitude);
      }, error => {
        console.log('Geolocation error:', error);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
}
  
/** 
 * Запрашивает данные о погоде по широте и долготе, вызывает displayCurrentWeather и fetchFiveDayForecast 
*/
function fetchWeatherDataByCoords(latitude, longitude) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${isCelsius ? 'metric' : 'imperial'}`)
      .then(response => response.json())
      .then(data => {
        if (data.cod === 200) {
          displayCurrentWeather(data);
          fetchFiveDayForecast(data.name); 
        }
      })
      .catch(error => console.log("Error:", error));
}
  
/** 
 * Запрашивает данные о погоде по названию города 
*/
function fetchWeatherData(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${isCelsius ? 'metric' : 'imperial'}`)
      .then(response => response.json())
      .then(data => {
        if (data.cod === 200) {
          displayCurrentWeather(data);
          fetchFiveDayForecast(city);
        }
      })
      .catch(error => console.log("Error:", error));
}
  
/** Отображает текущую погоду, используя данные из API */
function displayCurrentWeather(data) {
    document.getElementById('city').innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById('current-temp').innerText = `${Math.round(data.main.temp)}°`;
    document.getElementById('weather-desc').innerText = data.weather[0].description;
    document.getElementById('humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('wind-speed').innerText = `${Math.round(data.wind.speed)} ${isCelsius ? 'km/h' : 'mph'}`;
    document.getElementById('feels-like').innerText = `${Math.round(data.main.feels_like)}°`;
    document.getElementById('rain-chance').innerText = `${data.clouds.all}%`;
}
  
/** Запрашивает 5-дневный прогноз погоды и отображает данные */
function fetchFiveDayForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${isCelsius ? 'metric' : 'imperial'}`)
      .then(response => response.json())
      .then(data => {
        displayHourlyForecast(data.list.slice(0, 8));
        displayFiveDayForecast(data.list);
      })
      .catch(error => console.log("Error:", error));
}
  
/** 
 * Отображает прогноз погоды на ближайшие часы 
*/
function displayHourlyForecast(hourlyData) {
    const hourlyContainer = document.getElementById('hourly-forecast');
    hourlyContainer.innerHTML = '';
  
    hourlyData.forEach(data => {
      const time = new Date(data.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const temp = Math.round(data.main.temp);
      const weatherIcon = getWeatherIconPath(data.weather[0].id);
  
      const hourlyCard = document.createElement('div');
      hourlyCard.classList.add('forecast-card');
      hourlyCard.innerHTML = `
        <p>${time}</p>
        <img src="${weatherIcon}" alt="${data.weather[0].description}" width="50" height="50">
        <p>${temp}°</p>
      `;
      hourlyContainer.appendChild(hourlyCard);
    });
}
  
/** 
 * Отображает прогноз погоды на 5 дней 
*/
function displayFiveDayForecast(forecastData) {
    const forecastContainer = document.getElementById('five-day-forecast');
    forecastContainer.innerHTML = '';
  
    let dayCount = 0;
    for (let i = 7; i < forecastData.length && dayCount < 5; i += 8) {
      const dayData = forecastData[i];
      const date = new Date(dayData.dt * 1000);
      const day = date.toLocaleDateString(undefined, { weekday: 'short' });
      const temp = Math.round(dayData.main.temp);
      const weatherIcon = getWeatherIconPath(dayData.weather[0].id);
  
      const forecastCard = document.createElement('div');
      forecastCard.classList.add('forecast-card');
      forecastCard.innerHTML = `
        <p>${day}</p>
        <img src="${weatherIcon}" alt="${dayData.weather[0].description}" width="50" height="50">
        <p>${temp}°</p>
      `;
      forecastContainer.appendChild(forecastCard);
  
      dayCount++;
    }
}
  
/**
 *  Возвращает путь к иконке погоды, основываясь на ID погодных условий 
*/
function getWeatherIconPath(weatherId) {
    const iconPath = '/images/';
    if (weatherId >= 200 && weatherId < 300) {
      return `${iconPath}thunderstorm.svg`;
    } else if (weatherId >= 300 && weatherId < 500) {
      return `${iconPath}drizzle.svg`;
    } else if (weatherId >= 500 && weatherId < 600) {
      return `${iconPath}rain.svg`;
    } else if (weatherId >= 600 && weatherId < 700) {
      return `${iconPath}snow.svg`;
    } else if (weatherId >= 700 && weatherId < 800) {
      return `${iconPath}cloud.svg`;
    } else if (weatherId === 800) {
      return `${iconPath}sun.svg`;
    } else {
      return `${iconPath}default.svg`;
    }
}
  
/*
* Выбор города для инициализации
*/
fetchWeatherData('Almaty');