let config = {
	key: "5a4eac86caa3330d7669e69271e6a576",
	exclude: ["daily", "minutely", "current"],
	lat: null,
	long: null,
};

function formatTime(time) {
	return `${new Date(time * 1000).getHours()}:00`;
}

function getWeather() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition((position) => {
			config.lat = position.coords.latitude;
			config.long = position.coords.longitude;

			fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${config.lat}&lon=${config.long}&exclude=${config.exclude}&units=metric&appid=${config.key}`)
				.then((response) => response.json())
				.then((data) => {
					for (i = 0; i < 24; i += 2) {
						let temp = {
							metric: `${Math.ceil(data.hourly[i].temp)}°C`,
							imperial: `${Math.ceil(data.hourly[i].temp * 1.8 + 32)}°F`,
						};
						let icon = data.hourly[i].weather[0].icon;
						let description = data.hourly[i].weather[0].description;
						let time = {
							from: formatTime(data.hourly[i].dt),
							to: formatTime(data.hourly[i + 2].dt),
						};

						let card = `
							<div class="card">
								<span class="card__text card__text--temperature">
									${temp.metric}
									<div class="horiz-line"></div>
									${temp.imperial}
								</span>
								<img class="icon" src="assets/img/weather/${icon}.svg" alt="${description}">
								<div class="mobile-wrap">
									<span class="card__text card__text--description">${description}</span>
									<span class="card__text card__text--temperature-mobile">
										${temp.metric}
										<div class="horiz-line"></div>
										${temp.imperial}
									</span>
								</div>
								<span class="card__text card__text--time">${time.from}<div class="horiz-line"></div>${time.to}</span>
							</div>
						`;

						$(".weather").append(card);
					}

					$("#cancel-weather").removeClass("hidden");
				})
				.catch(function () {
					let card = `
						<div class="overlay__warning overlay__warning--weather">
							<img src="assets/img/warning.svg" alt="warning">
							<p>Looks like something went wrong!<br>Check you internet connection and try again later.</p>
						</div>
					`;
					$(".overlay__heading").after(card);
					$("#cancel-weather").removeClass("hidden");
				});
		});
	}
}

$(document).on("click", ".day__weather", function () {
	getWeather();
	toggleOverlay("on");
	overlay.append(weatherDialog);
});

$(document).on("click", "#cancel-weather", function () {
	toggleOverlay("off");
});
