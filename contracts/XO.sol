// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./Wallet.sol";


contract XO is Wallet {

    using Counters for Counters.Counter;

    event Win(string message);

    uint private _price = 500000000 gwei; // Цена за вход

    mapping (uint256 => address[2]) private _gamePlayers;   // сопоставление номера игры к игрокам
    mapping (address => uint256) private _whichGame;   // сопоставления адреса игрока к номеру игры в котором он находится (ноль = вне игры)
    mapping (uint256 => uint8[3][3]) private _gameStats;  // сопоставление номера игры к ситуации в игре
    Counters.Counter private _gameIds;  // счетчик игр

    constructor() {
        _gameIds.increment();  // счет запустим с еденицы. нулевая партия - вне игры
    }


    function addPlayerToGame(address _addr) internal {   // функция добавления игрока в новую игру с проверкой свободного слота в игре
        if (_gamePlayers[_gameIds.current()][0] == 0x0000000000000000000000000000000000000000) {
            _gamePlayers[_gameIds.current()][0] = _addr;
            _whichGame[msg.sender] = _gameIds.current();
        } else {
            _gamePlayers[_gameIds.current()][1] = _addr;
            _whichGame[msg.sender] = _gameIds.current();
            _gameIds.increment();
        }
    }

    function buyAlocation() external payable returns(bool){
        require(msg.value == _price, "Rejected");     //  проверка суммы оплаты
        require(_whichGame[msg.sender] == 0, "in Game");   //  проверка на нахождение игрока в игре
        (bool succes, ) = wallet.call{value: msg.value}("");
        require(succes, "call filed");    //  проверка на прохождение оплаты
        addPlayerToGame(msg.sender);   // добавление игрока в новую

        return succes;
    }

    function checkCountSteps() internal view returns(uint, uint) {  // проверка количества ходов игроков
        uint8[3][3] memory board = _gameStats[_whichGame[msg.sender]];
        uint one;
        uint two;
        for(uint i = 0; i < 3; i++) {
            for(uint j = 0; j < 3; j++) {
                if (board[j][i] == 1) {
                    one ++;
                } else if (board[j][i] == 2) {
                    two ++;
                }
            }
        }
        return (one, two);
    }

    function checkWin(uint label) internal view returns(bool) {   // проверка окончания игры
        uint8[3][3] memory board = _gameStats[_whichGame[msg.sender]];
        uint[3] memory x ;
        uint[3] memory y ;
        uint d_one;
        uint d_two;
        bool win;
        for(uint i = 0; i < 3; i++) {
            for(uint j = 0; j < 3; j++) {
                if (board[j][i] == label) {
                    x[j] ++;
                    y[i] ++;
                    if (i == j) {
                        d_one ++;
                    } else if ((i == 1 && j ==1) || (i == 0 && j ==2) || (i == 2 && j ==0)) {
                        d_two ++;
                    }
                }
            }
        }
        if (d_one == 3 || d_two == 3 || x[0] == 3 || x[1] == 3 || x[2] == 3 || y[0] == 3 || y[1] == 3 || y[2] == 3) {
            win = true;
        }
        return win;
    }

    function addStep(uint x, uint y) public returns(bool){   //  функция хода с проверкой в конце хода окончания игры и в начале хода проверка очереди
        uint game = _whichGame[msg.sender];
        require(game != 0, "Not paid");
        uint one;
        uint two;
        (one, two) = checkCountSteps();
        if (_gamePlayers[_whichGame[msg.sender]][0] == msg.sender) {
            require(two == one, "Opponent's move");
            require(_gameStats[_whichGame[msg.sender]][y][x] == 0, "Select an empty field");
            _gameStats[_whichGame[msg.sender]][y][x] = 1;
            if (checkWin(1)) {
                payable(msg.sender).transfer(1000000000000000000);
                _whichGame[_gamePlayers[game][0]] = 0;
                _whichGame[_gamePlayers[game][1]] = 0;
                emit Win('Game Over');
            }
        } else {
            require(two < one, "Opponent's move");
            require(_gameStats[_whichGame[msg.sender]][y][x] == 0, "Select an empty field");
            _gameStats[_whichGame[msg.sender]][y][x] = 2;
            if (checkWin(2)) {
                payable(msg.sender).transfer(1000000000000000000);
                _whichGame[_gamePlayers[game][0]] = 0;
                _whichGame[_gamePlayers[game][1]] = 0;
                emit Win('Game Over');
            }
        }

        return true;
    }

    function getGamePlayers(uint256 num) external view isOwner returns(address[2] memory) {
        return _gamePlayers[num];
    }

    function getWhichGame(address _addr) external view isOwner returns(uint256) {
        return _whichGame[_addr];
    }

    function getGameStats(uint256 num) external view returns(uint8[3][3] memory) {
        return _gameStats[num];
    }

}

