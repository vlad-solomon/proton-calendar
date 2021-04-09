const clockTime = $(".clock__time");
const clockDate = $(".clock__date");
const calendarControls = $(".calendar-controls .button");

let today = moment().format("DD-MM-YYYY");
let week = moment().isoWeek();
let currentMonday = 1;

setCurrentTime();
setCurrentDate();
generateWeek(currentMonday);

setInterval(function () {
	setCurrentTime();
}, 1000);

function setCurrentTime() {
	let currentTime = moment().format("HH:mm:ss");

	document.title = `Proton | ${currentTime}`;
	clockTime.text(currentTime);

	checkIfMidnight();
}

function setCurrentDate() {
	let currentDate = moment().isoWeek(week).format("[Week] W, YYYY");
	clockDate.text(currentDate);
}

function generateWeek(monday) {
	$(".week").children().remove();
	for (i = 0; i < 7; i++) {
		let dayDate = moment()
			.isoWeekday(i + monday)
			.format("dddd, DD.MM");
		let dayId = moment()
			.isoWeekday(i + monday)
			.format("DD-MM-YYYY");

		const day = `
			<div class="day" data-day-id="${dayId}">
				<div class="day__head">
					<span class="day__date">${dayDate}</span>
					<div class="day__badges"></div>
				</div>
				<div class="day__body">
					<div class="task">
						<span class="task__text">Take out the trash</span>
					</div>
				</div>
			</div>`;

		$(".week").append(day);
	}
	checkTasksLength();
	checkToday();
}

function checkToday() {
	if (!$(`.day[data-day-id="${today}"]`).find(".day__badges").children(".day__today").length) {
		$(`.day[data-day-id="${today}"]`).find(".day__badges").prepend(`<span class="day__today">Today</span>`);
	}
}

function checkIfMidnight() {
	if (clockTime.text() == "17:01:20") {
		today = moment().format("DD-MM-YYYY");
		week = moment().isoWeek();
		console.log(`Today is ${today}`);
		console.log(`This week is number ${week}`);
		setCurrentDate();
		generateWeek(currentMonday);
		checkIfCurrentWeek();
	}
}

function checkTasksLength() {
	$(".day").each(function () {
		let totalTasks = $(this).find(".task").length;
		if (totalTasks > 0) {
			$(this).find(".day__badges").append(`<span class="day__task">${totalTasks}</span>`);
		}
	});
}

function checkIfCurrentWeek() {
	if ($(".day__today").length) {
		$("#today").addClass("hidden");
	} else {
		$("#today").removeClass("hidden");
	}
}

calendarControls.click(function () {
	switch ($(this).attr("id")) {
		case "next":
			week++;
			generateWeek((currentMonday += 7));
			break;
		case "prev":
			week--;
			generateWeek((currentMonday -= 7));
			break;
		default:
			week = moment().isoWeek();
			currentMonday = 1;
			generateWeek(currentMonday);
			break;
	}
	checkIfCurrentWeek();
	setCurrentDate();
});

$(document).on("mouseenter", ".day", function () {
	$(this).find(".day__badges").prepend(`<span class="day__weather">Check weather</span>`);
});
$(document).on("mouseleave", ".day", function () {
	$(".day__weather").remove();
});
