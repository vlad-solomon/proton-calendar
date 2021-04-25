const clockTime = $(".clock__time");
const clockDate = $(".clock__date");
const calendarControls = $(".calendar-controls .button");
const overlay = $(".overlay");

let isReminding = false;

let todayIndex;
let today = moment().format("DD-MM-YYYY");
let week = moment().isoWeek();
let currentMonday = 1;
let remindersArray = [];
let everyMinute = (60 - moment().seconds()) * 1000;

setCurrentTime();
setCurrentDate();
generateWeek(currentMonday);
getReminders();

setInterval(function () {
	setCurrentTime();
}, 1000);

setTimeout(function () {
	checkReminders();
	setInterval(function () {
		checkReminders();
	}, 60000);
}, everyMinute);

function setCurrentTime() {
	let currentTime = moment().format("HH:mm:ss");
	clockTime.text(currentTime);

	document.title = isReminding ? "You've got a reminder!" : `Proton ∣ ${currentTime}`;
	checkIfMidnight();
}

function checkReminders() {
	for (i = 0; i < remindersArray.length; i++) {
		if (moment().format("HH:mm") == remindersArray[i][0]) {
			isReminding = true;
			toggleOverlay("on");
			if (!$(".overlay .reminder").length) {
				overlay.append(reminderDialog);
				$("#reminder-notification")[0].play();
			}
			$(".reminder .card__title").text(`Reminder for ${remindersArray[i][0]}`);
			$(".reminder").append(`<span class="reminder__task">${remindersArray[i][1]}</span>`);
		}
	}
}

$(document).on("click", "#close-reminder-dialog", function () {
	toggleOverlay("off");
	isReminding = false;
	getReminders();
	$("#reminder-notification")[0].pause();
	$("#reminder-notification")[0].currentTime = 0;
});

function setCurrentDate() {
	let currentDate = moment().isoWeek(week).format("[Week] W, YYYY");
	$(".week").attr("data-week-id", moment().isoWeek(week).format("W-YYYY"));
	clockDate.text(currentDate);
}

function checkRepeats() {
	for (i = 0; i < weeks.repeatedTasks.length; i++) {
		for (j = 0; j < weeks.repeatedTasks[i].repeats.length; j++) {
			let repeatedTaskTime = weeks.repeatedTasks[i].time;
			repeatedTaskTime = repeatedTaskTime != "" ? ` @ ${repeatedTaskTime}` : "";

			const repeatedTask = $("<div>");
			repeatedTask.addClass("task repeated");
			repeatedTask.text(`↺ ${weeks.repeatedTasks[i].title} ${repeatedTaskTime}`);
			// repeatedTask.append(`<img src="assets/img/repeat.svg">`);
			repeatedTask.attr("data-origin-week", weeks.repeatedTasks[i].originWeek);
			repeatedTask.attr("data-origin-day", weeks.repeatedTasks[i].originDay);
			repeatedTask.attr("data-origin-id", weeks.repeatedTasks[i].uuid);

			if ($(".week").attr("data-week-id") >= repeatedTask.attr("data-origin-week")) {
				if ($(".day").eq(weeks.repeatedTasks[i].repeats[j]).attr("data-day-id") != repeatedTask.attr("data-origin-day")) {
					$(".day").eq(weeks.repeatedTasks[i].repeats[j]).find(".day__tasks-wrapper").append(repeatedTask);
				}
			}
		}
	}
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

	checkRepeats();
	checkToday();

	for (i = 0; i < weeks.repeatedTasks.length; i++) {
		for (j = 0; j < weeks.repeatedTasks[i].deletedArray.length; j++) {
			$(`.day[data-day-id="${weeks.repeatedTasks[i].deletedArray[j]}"]`).find(`.task[data-origin-id="${weeks.repeatedTasks[i].uuid}"]`).remove();
		}
		for (k = 0; k < weeks.repeatedTasks[i].completedArray.length; k++) {
			$(`.day[data-day-id="${weeks.repeatedTasks[i].completedArray[k]}"]`).find(`.task[data-origin-id="${weeks.repeatedTasks[i].uuid}"]`).addClass("completed");
		}
	}
	checkTasksLength();
}

function checkToday() {
	if (!$(`.day[data-day-id="${today}"]`).find(".day__badges").children(".day__today").length) {
		$(`.day[data-day-id="${today}"]`).find(".day__badges").prepend(`<span class="day__today">Today</span>`);
	}
	todayIndex = $(".day__today").parents().eq(2).index();
}

function checkIfMidnight() {
	if (clockTime.text() == "00:00:00") {
		today = moment().format("DD-MM-YYYY");
		todayIndex = $(".day__today").parents().eq(2).index();
		week = moment().isoWeek();
		setCurrentDate();
		generateWeek(currentMonday);
		getReminders();
		checkIfCurrentWeek();
	}
}

function checkTasksLength() {
	$(".day").each(function () {
		let totalTasks = $(this).find(".task").length - $(this).find(".task.completed").length;
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

function getReminders() {
	let todayWeek = $(".week").attr("data-week-id");
	remindersArray = [];
	if (weeks.hasOwnProperty(todayWeek)) {
		if (weeks[todayWeek].hasOwnProperty(today)) {
			for (let i = 0; i < weeks[todayWeek][today].length; i++) {
				if (weeks[todayWeek][today][i].reminder == true && weeks[todayWeek][today][i].completed == false && weeks[todayWeek][today][i].time > clockTime.text()) {
					remindersArray.push([weeks[todayWeek][today][i].time, weeks[todayWeek][today][i].title]);
				}
			}
		}
	}
	if (weeks.repeatedTasks.length > 0) {
		for (j = 0; j < weeks.repeatedTasks.length; j++) {
			if (weeks.repeatedTasks[j].repeats.includes(todayIndex) && weeks.repeatedTasks[j].time > clockTime.text()) {
				remindersArray.push([weeks.repeatedTasks[j].time, weeks.repeatedTasks[j].title]);
			}
		}
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
	checkIfCurrentWeek();
});

$(document).on("mouseenter", ".day", function () {
	if (!$(".add-task").length) {
		$(this).find(".day__badges").prepend(`<span class="day__weather">Check weather</span>`);
		$(this).find(".day__tasks-wrapper").append(addTaskButton);
	}
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
	taskTimeCleave = new Cleave("#task-time", {
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
let selectedTaskId, selectedTaskObject;

$(document).on("click", ".task", function () {
	isEditingTask = true;
	selectedWeek = $(".week").attr("data-week-id");
	selectedDay = $(this).parents().eq(2).attr("data-day-id");
	selectedTaskId = $(this).attr("data-uuid");
	if (!$(this).hasClass("repeated")) {
		selectedTaskObject = weeks[selectedWeek][selectedDay].find((task) => task.uuid === selectedTaskId);
	} else {
		let originWeek = $(this).attr("data-origin-week");
		let originDay = $(this).attr("data-origin-day");
		let originId = $(this).attr("data-origin-id");

		selectedTaskObject = weeks[originWeek][originDay].find((task) => task.uuid === originId);
		humazinedDay = `Repeated task`;

		const repeatWarning = `
			<div class="overlay__warning">
				<p>This is a repeated task from ${originDay.replace(/-/g, ".")}.</p>
				<p>All the changes you make to this task will modify the original one.</p>
			</div>
		`;

		$(".overlay__heading").after(repeatWarning);
		$("#accept").addClass("repeated");
	}

	$(".overlay__heading").text(humazinedDay);
	$("#task-title").val(selectedTaskObject.title);
	$("#task-description").val(selectedTaskObject.description);
	$("#task-time").val(selectedTaskObject.time);

	if (selectedTaskObject.reminder == true) {
		$(".button--reminder").removeClass("button--off").text("ON").attr("data-reminder", "true");
	}
	if (selectedTaskObject.repeats.length > 0) {
		$(".week-days").attr("data-repeats", JSON.stringify(selectedTaskObject.repeats));
		repeatDays = JSON.parse($(".week-days").attr("data-repeats"));
		for (i = 0; i < selectedTaskObject.repeats.length; i++) {
			$(".week-days__button").eq(selectedTaskObject.repeats[i]).removeClass("button--off");
		}
	}
	if (selectedTaskObject.time != "") {
		$(".reminder-wrap").removeClass("hidden");
	}

	$("#task-title").css("height", `${$("#task-title")[0].scrollHeight + 1}px`);
	$("#task-description").css("height", `${$("#task-description")[0].scrollHeight + 1}px`);
});

$(document).on("click", ".button--reminder", function () {
	$(this).toggleClass("button--off");
	if ($(this).hasClass("button--off")) {
		$(this).text("OFF").attr("data-reminder", "false");
	} else {
		$(this).text("ON").attr("data-reminder", "true");
	}
});

let repeatDays = [];

$(document).on("click", ".week-days__button", function () {
	if ($(this).hasClass("button--off")) {
		$(this).removeClass("button--off");
		repeatDays.push($(this).index());
	} else {
		$(this).addClass("button--off");
		repeatDays.splice(
			repeatDays.findIndex((index) => index === $(this).index()),
			1
		);
	}
	repeatDays = repeatDays.sort();
	$(".week-days").attr("data-repeats", JSON.stringify(repeatDays));
});

$(document).on("click", "#accept", function () {
	let uniqueId = uuid.v4();
	const taskObject = {
		uuid: uniqueId,
		title: $("#task-title").val(),
		description: $("#task-description").val(),
		time: $("#task-time").val(),
		completed: false,
		reminder: JSON.parse($(".button--reminder").attr("data-reminder")),
		repeats: JSON.parse($(".week-days").attr("data-repeats")),
		originWeek: selectedWeek,
		originDay: selectedDay,
		deletedArray: [],
		completedArray: [],
	};
	if (weeks[selectedWeek] == undefined) {
		weeks[selectedWeek] = {};
	}
	if (weeks[selectedWeek][selectedDay] == undefined && !$(this).hasClass("repeated")) {
		weeks[selectedWeek][selectedDay] = [];
	}
	if (isEditingTask) {
		selectedTaskObject.title = $("#task-title").val();
		selectedTaskObject.description = $("#task-description").val();
		selectedTaskObject.time = $("#task-time").val();
		selectedTaskObject.reminder = JSON.parse($(".button--reminder").attr("data-reminder"));
		selectedTaskObject.repeats = JSON.parse($(".week-days").attr("data-repeats"));
		if (selectedTaskObject.repeats.length > 0) {
			weeks.repeatedTasks.splice(
				weeks.repeatedTasks.findIndex((index) => index.uuid === selectedTaskObject.uuid),
				1,
				selectedTaskObject
			);
		}
		if (selectedTaskObject.repeats.length == 0) {
			weeks.repeatedTasks.splice(
				weeks.repeatedTasks.findIndex((index) => index.uuid === selectedTaskObject.uuid),
				1
			);
		}
		isEditingTask = false;
	} else {
		weeks[selectedWeek][selectedDay].push(taskObject);
		if (taskObject.repeats.length > 0) {
			weeks.repeatedTasks.push(taskObject);
		}
	}

	repeatDays = [];
	generateWeek(currentMonday);
	toggleOverlay("off");
	getReminders();
});

$(document).on("click", "#cancel", function () {
	repeatDays = [];
	toggleOverlay("off");
	isEditingTask = false;
});

$(document).on("keyup keydown click", ".create-task", function () {
	if (!isEditingTask && $("#task-title").val().trim().length > 0) {
		$("#accept").removeClass("hidden");
	} else {
		$("#accept").addClass("hidden");
	}
	if (isEditingTask) {
		if (
			selectedTaskObject.title != $("#task-title").val() ||
			selectedTaskObject.description != $("#task-description").val() ||
			selectedTaskObject.time != $("#task-time").val() ||
			selectedTaskObject.reminder != JSON.parse($(".button--reminder").attr("data-reminder")) ||
			JSON.stringify(selectedTaskObject.repeats) != $(".week-days").attr("data-repeats")
		) {
			$("#accept").removeClass("hidden");
		}
		if ($("#task-title").val().length == 0) {
			$("#accept").addClass("hidden");
		}
	}
	if ($("#task-time").val().length > 0) {
		$(".reminder-wrap").removeClass("hidden");
	} else {
		$(".reminder-wrap").addClass("hidden");
		$(".button--reminder").text("OFF").attr("data-reminder", "false").addClass("button--off");
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

$(document).on("mouseenter", ".task", function () {
	$(this).append(taskBadges);
});

$(document).on("mouseleave", ".task", function () {
	$(this).find(".task__badges").remove();
});

$(document).on("click", ".task__badges img", function (event) {
	event.stopPropagation();
	let clickedTaskWeek = $(".week").attr("data-week-id");
	let clickedTaskDay = $(this).parents().eq(4).attr("data-day-id");
	if (!$(this).parents().eq(1).hasClass("repeated")) {
		let clickedTaskId = $(this).parents().eq(1).attr("data-uuid");
		let clickedTaskObject = weeks[clickedTaskWeek][clickedTaskDay].find((task) => task.uuid === clickedTaskId);
		let clickedTaskObjectIndex = weeks[clickedTaskWeek][clickedTaskDay].findIndex((task) => task.uuid === clickedTaskId);
		switch ($(this).attr("id")) {
			case "complete-task":
				clickedTaskObject.completed = !clickedTaskObject.completed;
				break;
			case "remove-task":
				weeks[clickedTaskWeek][clickedTaskDay].splice(clickedTaskObjectIndex, 1);
				weeks.repeatedTasks.splice(
					weeks.repeatedTasks.findIndex((task) => task.uuid == clickedTaskId),
					1
				);
				if (weeks[clickedTaskWeek][clickedTaskDay].length == 0) {
					delete weeks[clickedTaskWeek][clickedTaskDay];
				}
				break;
		}
	} else {
		let originId = $(this).parents().eq(1).attr("data-origin-id");
		let index = weeks.repeatedTasks.findIndex((task) => task.uuid === originId);
		switch ($(this).attr("id")) {
			case "complete-task":
				if (!weeks.repeatedTasks[index].completedArray.includes(clickedTaskDay)) {
					weeks.repeatedTasks[index].completedArray.push(clickedTaskDay);
				} else {
					weeks.repeatedTasks[index].completedArray.splice(
						weeks.repeatedTasks[index].completedArray.findIndex((task) => task === clickedTaskDay),
						1
					);
				}
				break;
			case "remove-task":
				weeks.repeatedTasks[index].deletedArray.push(clickedTaskDay);
				break;
		}
	}

	generateWeek(currentMonday);
	getReminders();
});

function checkTasks() {
	let focusedWeek = $(".week").attr("data-week-id");
	let focusedWeekDays = Object.keys(weeks[focusedWeek]);
	for (let i = 0; i < focusedWeekDays.length; i++) {
		for (let j = 0; j < weeks[focusedWeek][focusedWeekDays[i]].length; j++) {
			let taskText = weeks[focusedWeek][focusedWeekDays[i]][j].title;
			let taskTime = weeks[focusedWeek][focusedWeekDays[i]][j].time;
			let uniqueId = weeks[focusedWeek][focusedWeekDays[i]][j].uuid;
			let taskStatus = weeks[focusedWeek][focusedWeekDays[i]][j].completed;

			taskTime = taskTime != "" ? ` @ ${taskTime}` : "";

			const task = $("<div>");
			task.addClass("task");
			task.attr("data-uuid", uniqueId);
			task.text(`${taskText}${taskTime}`);

			if (taskStatus == true) {
				task.addClass("completed");
			}

			$(`.day[data-day-id="${focusedWeekDays[i]}"]`).find(".day__tasks-wrapper").append(task);
		}
	}
}
