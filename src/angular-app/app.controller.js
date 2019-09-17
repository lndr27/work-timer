const fs = require('fs');
const _ = require('lodash');
const { remote, ipcRenderer } = require('electron');
const { dialog, getCurrentWindow, Menu } = remote;

var app = angular.module("App", []);

const browserWindow = getCurrentWindow();

app.controller("MainController", function ($scope, $interval, AppService) {

    const intervaloJornada4hrs = 0;
    const intervaloJornada6hrs = 15;
    const intervaloJornada8hrs = 60;

    $scope.isMaximizado = false;

    window.foo = $scope;

    $scope.diff = {};

    $scope.isRunning = false;

    $scope.timesheet = [];

    /**
     * Texto exibido no rodape da janela
     */
    $scope.statusAplicacao = '';

    /**
     * Funcao acionada ao carregar a janela principal
     */
    $scope.init = function () {

        $scope.model = {
            horarios: []
        };

        $('body').on('keydown', evt => {
            if (evt.keyCode === 123)
                browserWindow.webContents.toggleDevTools();
        });
    };

    $scope.updateTime = function (time) {
        var timeStr = (time.hours + '').split(':');
        var hours = +timeStr[0];
        var min = +timeStr[1];
        if (hours < 0 || hours > 23) { return false; }
        if (min < 0 || min > 59) { return false; }

        time.date = new Date();
        time.date.setHours(hours, min, 0, 0);
    };

    $scope.addEntry = function () {
        if ($scope.timesheet.length >= 6) {return;}

        var date = new Date();
        $scope.timesheet.push({ 
            date: date,
            hours: `${_.padStart(date.getHours(), 2, '0')}:${_.padStart(date.getMinutes(), 2, '0')}`
        })
        if ($scope.timesheet.length === 1 && !$scope.isRunning) {
            $scope.iniciar();
        }
    };

    $scope.iniciar = () => {
        $scope.isRunning = !$scope.isRunning;

        if ($scope.isRunning) {
            updateTimer();
            $scope.timer = $interval(updateTimer, 1000);
        }
    };

    var updateTimer = () => {
        if (!$scope.isRunning) {
            $scope.timer(); 
            return; 
        }
        if ($scope.timesheet.length === 0) { return; }

        var minutesWorked = getMinutesWorked($scope.timesheet);
        var mintuesBreak = getMinutesBreak($scope.timesheet);
        
        var timeLeftBreak = 0;

        $scope.timeToLeave4hrs = new Date();
        $scope.timeToLeave4hrs.setMinutes($scope.timeToLeave4hrs.getMinutes() + (240 - minutesWorked));
        if (minutesWorked >= 240) {
            $scope.timeToLeave4hrs = 'errou';
        }
        
        $scope.timeToLeave6hrs = new Date();
        timeLeftBreak = mintuesBreak - 15;
        timeLeftBreak = timeLeftBreak < 0 ? 0 : 15;
        $scope.timeToLeave6hrs.setMinutes($scope.timeToLeave6hrs.getMinutes() + (375 - minutesWorked - timeLeftBreak));
        if ((375 - minutesWorked - timeLeftBreak) <= 0) {
            $scope.timeToLeave6hrs = 'errou';
        }

        $scope.timeToLeave8hrs = new Date();
        timeLeftBreak = mintuesBreak - 60;
        timeLeftBreak = timeLeftBreak < 0 ? 0 : 60;
        $scope.timeToLeave8hrs.setMinutes($scope.timeToLeave8hrs.getMinutes() + (540 - minutesWorked - timeLeftBreak));
        if ((540 - minutesWorked - timeLeftBreak) <= 0) {
            $scope.timeToLeave8hrs = 'errou';
        }
        
        $scope.timeToLeave10hrs = new Date();
        $scope.timeToLeave10hrs.setMinutes($scope.timeToLeave10hrs.getMinutes() + (660 - minutesWorked - timeLeftBreak));
        if ((660 - minutesWorked - timeLeftBreak) <= 0) {
            $scope.timeToLeave10hrs = 'errou';
        }

        var minutes = minutesWorked % 60;
        var hours = Math.floor(minutesWorked / 60);
        $scope.formatedTimeWorked = `${_.padStart(hours, 2, '0')}:${_.padStart(minutes, 2, '0')}`;
        
        minutes = mintuesBreak % 60;
        hours = Math.floor(mintuesBreak / 60);
        $scope.formatedTimeBreak = `${_.padStart(hours, 2, '0')}:${_.padStart(minutes, 2, '0')}`;
    };

    $scope.startStopTimer = () => {
        if (!_.isDate($scope.timeInput)) { return; }
        var newTime = new Date();
        newTime.setHours($scope.timeInput.getHours(), $scope.timeInput.getMinutes());
        $scope.timesheet.push({ date: newTime });
    };

    const getMinutesWorked = (timesheet) => {
        var minutesWorked = 0;
        forEachPair(timesheet, (start, stop) => {
            stop = stop || { date: new Date() };
            minutesWorked += milisToMinutes(stop.date.getTime() - start.date.getTime());
        });
        return minutesWorked;
    };

    const getMinutesBreak = (timesheet) => {
        var minutes = 0;
        if (timesheet.length >= 3) {
            minutes += milisToMinutes(timesheet[2].date.getTime() - timesheet[1].date.getTime());
        }
        if (timesheet.length >= 5) {
            minutes += milisToMinutes(timesheet[4].date.getTime() - timesheet[3].date.getTime());
        }
        return minutes;
    };

    $scope.alwaysOnTop = function () {
        ipcRenderer.send('alwaysOnTop');
    };

    $scope.showWindow = function () {
        ipcRenderer.send('set-opacity', 1);
    };

    $scope.hideWindow = function () {
        ipcRenderer.send('set-opacity', 0.65);
    };

    var opacity = 1;
    $scope.setOpacity = function () {
        opacity = opacity === 1 ? 0.65 : 1;
        ipcRenderer.send('set-opacity', opacity);
    };

    /**
     * Fechar aplicacao
     */
    $scope.sair = () => ipcRenderer.send('sair');

    /**
     * Minimizar Janela
     */
    $scope.minimizar = () => browserWindow.minimize();

    /**
     * Maximiza ou Restaura janela
     */
    $scope.maximizar = () => {
        browserWindow.isMaximized() ? browserWindow.restore() : browserWindow.maximize();
        $scope.isMaximizado = !$scope.isMaximizado;
    };
});