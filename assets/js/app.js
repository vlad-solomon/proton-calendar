const clockTime = $(".clock__time");
const clockDate = $(".clock__date");
const calendarControls = $(".calendar-controls .button");
const overlay = $(".overlay");

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

	document.title = `Proton ∣ ${currentTime}`;
	clockTime.text(currentTime);

	checkIfMidnight();
}

function setCurrentDate() {
	let currentDate = moment().isoWeek(week).format("[Week] W, YYYY");
	$(".week").attr("data-week-id", moment().isoWeek(week).format("W-YYYY"));
	clockDate.text(currentDate);
}

function generateWeek(monday) {
	let weekId = $(".week").attr("data-week-id");
	$(".week").children().remove();
	for (let i = 0; i < 7; i++) {
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
					<div class="day__tasks-wrapper"></div>
				</div>
			</div>`;

		$(".week").append(day);
	}

	if (weeks.hasOwnProperty(weekId)) {
		checkTasks();
	}
	checkToday();
}

function checkToday() {
	if (!$(`.day[data-day-id="${today}"]`).find(".day__badges").children(".day__today").length) {
		$(`.day[data-day-id="${today}"]`).find(".day__badges").prepend(`<span class="day__today">Today</span>`);
	}
}

function checkIfMidnight() {
	if (clockTime.text() == "00:00:00") {
		today = moment().format("DD-MM-YYYY");
		week = moment().isoWeek();
		console.log(`Today is ${today}`);
		console.log(`This week is number ${week}`);
		setCurrentDate();
		generateWeek(currentMonday);
		checkIfCurrentWeek();
	}
}

// TODO refine this function : when a task is added all days are checked

function checkTasksLength() {
	$(".day").each(function () {
		let totalTasks = $(this).find(".task").length;
		if (totalTasks > 0) {
			$(this).find(".day__badges").find(".day__task").text(totalTasks);
			if ($(this).find(".day__badges").find(".day__task").length == 0) {
				$(this).find(".day__badges").append(`<span class="day__task">${totalTasks}</span>`);
			}
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
			setCurrentDate();
			generateWeek((currentMonday += 7));
			break;
		case "prev":
			week--;
			setCurrentDate();
			generateWeek((currentMonday -= 7));
			break;
		default:
			week = moment().isoWeek();
			currentMonday = 1;
			setCurrentDate();
			generateWeek(currentMonday);
			break;
	}
	// setCurrentDate();
	checkIfCurrentWeek();
	// checkTasks();
});

$(document).on("mouseenter", ".day", function () {
	$(this).find(".day__badges").prepend(`<span class="day__weather">Check weather</span>`);
	$(this).find(".day__tasks-wrapper").append(addTaskButton);
});
$(document).on("mouseleave", ".day", function () {
	$(".day__weather").remove();
	$(".add-task").remove();
});

function toggleOverlay(condition) {
	switch (condition) {
		case "on":
			overlay.removeClass("hidden");
			break;
		case "off":
			overlay.addClass("hidden");
			overlay.children().remove();
			break;
	}
}

let humazinedDay;
let selectedWeek, selectedDay;

$(document).on("click", ".day__tasks-wrapper > *", function () {
	humazinedDay = $(this).parents().eq(2).find(".day__head .day__date").text();

	toggleOverlay("on");
	overlay.append(createTaskDialog);

	autosize($("textarea"));
	const taskTimeCleave = new Cleave("#task-time", {
		time: true,
		timePattern: ["h", "m"],
	});
});

$(document).on("click", ".add-task", function () {
	selectedWeek = $(".week").attr("data-week-id");
	selectedDay = $(this).parents().eq(2).attr("data-day-id");

	$(".overlay__heading").text(humazinedDay);
	$("#task-title").focus();
});

let isEditingTask = false;
let selectedTask, selectedTaskObject;

$(document).on("click", ".task", function () {
	isEditingTask = true;
	selectedWeek = $(".week").attr("data-week-id");
	selectedDay = $(this).parents().eq(2).attr("data-day-id");
	selectedTaskId = $(this).attr("data-uuid");
	selectedTaskObject = weeks[selectedWeek][selectedDay].find((task) => task.uuid === selectedTaskId);

	$(".overlay__heading").text(humazinedDay);
	$("#task-title").val(selectedTaskObject.title);
	$("#task-description").val(selectedTaskObject.description);
	$("#task-time").val(selectedTaskObject.time);

	$("#task-title").css("height", `${$("#task-title")[0].scrollHeight + 1}px`);
	$("#task-description").css("height", `${$("#task-description")[0].scrollHeight + 1}px`);
});

$(document).on("click", "#accept", function () {
	let uniqueId = uuid.v4();
	const taskObject = {
		uuid: uniqueId,
		title: $("#task-title").val(),
		description: $("#task-description").val(),
		time: $("#task-time").val(),
	};
	if (weeks[selectedWeek] == undefined) {
		weeks[selectedWeek] = {};
	}
	if (weeks[selectedWeek][selectedDay] == undefined) {
		weeks[selectedWeek][selectedDay] = [];
	}
	if (isEditingTask) {
		selectedTaskObject.title = $("#task-title").val();
		selectedTaskObject.description = $("#task-description").val();
		selectedTaskObject.time = $("#task-time").val();
		isEditingTask = false;
	} else {
		weeks[selectedWeek][selectedDay].push(taskObject);
	}
	generateWeek(currentMonday);
	toggleOverlay("off");
});

$(document).on("click", "#cancel", function () {
	toggleOverlay("off");
	isEditingTask = false;
});

// * this works for the simple createTaskComponent
// todo add the reminder and repeat logic later

// ! refactor this shitty if
$(document).on("keyup keydown click", ".create-task", function () {
	if (!isEditingTask && $("#task-title").val().length > 0) {
		$("#accept").removeClass("hidden");
	} else {
		$("#accept").addClass("hidden");
	}
	if (isEditingTask) {
		if (selectedTaskObject.title != $("#task-title").val() || selectedTaskObject.description != $("#task-description").val() || selectedTaskObject.time != $("#task-time").val()) {
			$("#accept").removeClass("hidden");
		}
		if ($("#task-title").val().length == 0) {
			$("#accept").addClass("hidden");
		}
	}
});

$(document).on("blur", "#task-time", function () {
	let inputValue = this.value;
	switch (inputValue.length) {
		case 1:
			this.value += "0:00";
			break;
		case 2:
			this.value += ":00";
			break;
		case 3:
			this.value += "00";
			break;
		case 4:
			this.value += "0";
			break;
	}
});

function checkTasks() {
	let focusedWeek = $(".week").attr("data-week-id");
	let focusedWeekDays = Object.keys(weeks[focusedWeek]);
	for (let i = 0; i < focusedWeekDays.length; i++) {
		for (let j = 0; j < weeks[focusedWeek][focusedWeekDays[i]].length; j++) {
			let taskText = weeks[focusedWeek][focusedWeekDays[i]][j].title;
			let taskTime = weeks[focusedWeek][focusedWeekDays[i]][j].time;
			let uniqueId = weeks[focusedWeek][focusedWeekDays[i]][j].uuid;

			taskTime = taskTime != "" ? ` @ ${taskTime}` : "";

			const task = $("<div>");
			task.addClass("task");
			task.attr("data-uuid", uniqueId);
			task.text(`${taskText}${taskTime}`);

			$(`.day[data-day-id="${focusedWeekDays[i]}"]`).find(".day__tasks-wrapper").append(task);
		}
	}
	checkTasksLength();
}

// $(".button--reminder").click(function () {
// 	$(this).toggleClass("button--off");
// 	if ($(this).hasClass("button--off")) {
// 		$(this).text("OFF");
// 	} else {
// 		$(this).text("ON");
// 	}
// });

// $(".week-days__button").click(function () {
// 	$(this).toggleClass("button--off");
// });
