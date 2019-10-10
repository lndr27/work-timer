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

    $scope.diff = {};

    $scope.isRunning = false;

    $scope.timesheet = [];

    /**
     * Texto exibido no rodape da janela
     */
    $scope.statusAplicacao = '';

    const saveToFile  = _.throttle(function () {
        ipcRenderer.send('save-to-file', $scope.timesheet);
    }, 500, {trailing:true});

    /**
     * Funcao acionada ao carregar a janela principal
     */
    $scope.init = function () {
        $scope.isAlwaysOnTop = true;
        $scope.model = {
            horarios: []
        };

        ipcRenderer.send('get-backup');
        ipcRenderer.on('get-backup-response', (evt, data) => {            
            if (!data) {return;}
            data =JSON.parse(data);
            if (!_.isArray(data)) { return; }
            _.forEach(data, (d) => {
                d.date = new Date(d.date);
            });
            $scope.timesheet = data;
            $scope.iniciar();
        });

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
        updateTimer();
        saveToFile();
    };

    $scope.removeEntry = function (time) {
        $scope.timesheet.splice($scope.timesheet.indexOf(time), 1);
        saveToFile();
        updateTimer();
    };

    $scope.addEntry = function () {
        if ($scope.timesheet.length >= 6) { return; }

        var date = new Date();
        date.setSeconds(0, 0);
        $scope.timesheet.push({
            date: date,
            hours: `${_.padStart(date.getHours(), 2, '0')}:${_.padStart(date.getMinutes(), 2, '0')}`
        })
        if ($scope.timesheet.length === 1 && !$scope.isRunning) {
            $scope.iniciar();
        }
        saveToFile();
    };

    $scope.iniciar = () => {
        $scope.isRunning = !$scope.isRunning;

        if ($scope.isRunning) {
            updateTimer();
            $scope.timer = $interval(updateTimer, 60 * 1000);
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

        $scope.formatedTimeBreak = '00:00';
        $scope.formatedTimeWorked = '00:00';

        var timeLeftBreak = 0;

        $scope.timeToLeave4hrs = new Date();
        $scope.timeToLeave4hrs.setMinutes($scope.timeToLeave4hrs.getMinutes() + (240 - minutesWorked));
        if (minutesWorked === 240) {
            _sendNotification('4 Horas', 'Já trabalhou 4 horas!');
        }
        if (minutesWorked >= 240) {
            $scope.timeToLeave4hrs = 'errou';
        }

        $scope.timeToLeave6hrs = new Date();
        timeLeftBreak = mintuesBreak - 15;
        timeLeftBreak = timeLeftBreak < 0 ? 0 : 15;
        let diff = (375 - minutesWorked - timeLeftBreak);
        $scope.timeToLeave6hrs.setMinutes($scope.timeToLeave6hrs.getMinutes() + diff);
        if (diff === 0) {
            _sendNotification('Já trabalhou 6 Horas', 'Já trabalhou 6 horas!');
        }
        if (diff <= 0) {
            $scope.timeToLeave6hrs = 'errou';
        }

        $scope.timeToLeave8hrs = new Date();
        timeLeftBreak = mintuesBreak - 60;
        timeLeftBreak = timeLeftBreak < 0 ? 0 : 60;
        diff = (540 - minutesWorked - timeLeftBreak);
        $scope.timeToLeave8hrs.setMinutes($scope.timeToLeave8hrs.getMinutes() + diff);
        if (diff === 0) {
            _sendNotification('Já trabalhou 8 Horas', 'Vai embora animal!');
        }
        if (diff <= 0) {
            $scope.timeToLeave8hrs = 'errou';
        }

        $scope.timeToLeave10hrs = new Date();
        diff = (660 - minutesWorked - timeLeftBreak);
        $scope.timeToLeave10hrs.setMinutes($scope.timeToLeave10hrs.getMinutes() + diff);
        if (diff === 0) {
            _sendNotification('Já trabalhou 10 Horas', 'Ta fazendo que ainda aqui seu retardado?! Sai dai jumento!');
        }
        if (diff <= 0) {
            $scope.timeToLeave10hrs = 'errou';
        }

        var minutes = minutesWorked % 60;
        var hours = Math.floor(minutesWorked / 60);
        $scope.formatedTimeWorked = `${_.padStart(hours, 2, '0')}:${_.padStart(minutes, 2, '0')}`;

        if (mintuesBreak < 0) { mintuesBreak = 0; }
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
        var agora = (new Date()).getTime();
        var minutes = 0;
        if (timesheet.length >= 2) {
            minutes += milisToMinutes((_.get(timesheet, '[2].date.getTime()') || agora) - timesheet[1].date.getTime());
        }
        if (timesheet.length >= 4) {
            minutes += milisToMinutes((_.get(timesheet, '[4].date.getTime()') || agora) - timesheet[3].date.getTime());
        }
        return minutes;
    };

    $scope.alwaysOnTop = function () {
        $scope.isAlwaysOnTop = !$scope.isAlwaysOnTop;
        ipcRenderer.send('alwaysOnTop');
    };

    $scope.activeBottomRight = function () {
        $scope.isActiveBottomRighActive = !$scope.isActiveBottomRighActive;
        ipcRenderer.send('activeBottomRight', $scope.isActiveBottomRighActive);
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


    const _sendNotification = function (titulo, msg) {
        new Notification(titulo, {
            body: msg
        });
    };
});