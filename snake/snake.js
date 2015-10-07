Scores = new Mongo.Collection("scores");
//Trash = new Mongo.Collection("trash");

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}

if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault('sessionScore', 0);
    var dir= {x:-1, y:0};
    var prevDir= {x:-1, y:0};
    var food = {x:-1, y:-1};
    var eagle = {x:1, y:1};
    var nRows = 24;
    var nCols = 24;
    var snakeBody = [];
    var gameContinue = false;
    var score = 0;
    var highScore = 0;
    var enable = false;
    Template.scoreTemplate.rendered = function() {
        if(!this._rendered) {
            this._rendered = true;
            $('.score').html(Session.get('sessionScore'));
        }
    }

    Template.scoreTemplate.helpers({

    });

    Template.gameTemplate.helpers({

    });

    renderGameBoard = function() {
        enable = true;
        score = 0;
        $(".score").html(score);
        $(".highScore").html(highScore);
        dir= {x:0, y:0};
        prevDir= {x:0, y:0};
        food = {x:-1, y:-1};
        eagle = {x:1, y:1};
        snakeBody = [];
        gameContinue = false;
        var snake = {x:0, y:0};
        snake.x = nRows / 2;
        snake.y = nCols / 2;
        snakeBody.push(snake);
        setBoard();
        makeFood();
        drawSnake();
        id = "r" + eagle.x + "c" + eagle.y;
        $("#" + id).toggleClass("eagle");
    }

    setBoard = function() {
        var table = "<table>";
        for(var i=0; i < nRows; i ++) {
            table += "<tr>";
            for(var j=0; j < nCols; j ++) {
                var cellClass = "cell";
                id = "r" + i + "c" + j;
                table += "<td><div class='"+cellClass+ "' id='" + id +"'></div></td>";
            }
            table += "</tr>";
        }
        $('#theMap').html(table);
    };

    moveSnake = function(e) {
        prevDir = {x: dir.x, y: dir.y};
        gameContinue = true;
        switch(e.keyCode) {
            case 38:      // UP: 38
            dir.x = -1;
            dir.y = 0;
            break;
            case 40:      // DOWN: 40
            dir.x = 1;
            dir.y = 0;
            break;
            case 39:      // LEFT: 37
            dir.x = 0;
            dir.y = 1;
            break;
            case 37:      // RIGHT: 39
            dir.x = 0;
            dir.y = -1;
            break;
        }
        if (snakeBody.length > 1 && oppositeDirection(prevDir, dir)) {
            dir = {x: prevDir.x, y: prevDir.y};
        }
        /*
        Trash.insert({
            x: dir.x,
            y: dir.y,
            owner: Meteor.userId(),
        });
        console.log(Trash.find({}));
        */
        //redrawSnake();
    }

    moveNatural = function(e) {
        if (gameContinue && enable) {
            redrawSnake();
            eagleMove();
        }
    }

    drawSnake = function() {
        for (var i = 0; i < snakeBody.length; i++) {
            id = "r" + snakeBody[i].x + "c" + snakeBody[i].y;
            $("#" + id).toggleClass("snake");
        }
    }

    endGame = function() {
        Scores.insert({
            score: score,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
        message = "";
        gameContinue = false;
        enable = false;
        if (score > highScore) {
            highScore = score;
            $(".highScore").html(highScore);
            message += "New high score !!!";
        } else {
            message += "Game over."
        }

        var r = confirm(message + " You score " + score + " points.\nDo you want to play again?");
        if (r == true) {
            renderGameBoard();
        }
    }

    redrawSnake = function() {
        var last = snakeBody.length - 1;
        var newX = snakeBody[last].x + dir.x;
        var newY = snakeBody[last].y + dir.y;
        if (!(newX >= 0 && newX < nRows && newY >= 0 && newY < nCols) || isOnSnake({x:newX,y:newY}) || isOnSnake(eagle)) {
            return endGame();
        }

        if (newX == food.x && newY == food.y) {
            score++;
            $(".score").html(score);
            makeFood();
        } else {
            var tail = snakeBody.shift();
            id = "r" + tail.x + "c" + tail.y;
            $("#" + id).toggleClass("snake");
        }

        var head = {x: newX, y: newY};
        snakeBody.push(head);
        id = "r" + newX + "c" + newY;
        $("#" + id).toggleClass("snake");
    }

    oppositeDirection = function(oldDir, newDir) {
        if (oldDir.x == newDir.x) {
            return oldDir.y == -newDir.y;
        }
        if (oldDir.y == newDir.y) {
            return oldDir.x == -newDir.x;
        }
        return false;
    }

    makeFood = function() {
        if (food.x != -1) {
            id = "r" + food.x + "c" + food.y;
            $("#" + id).toggleClass("food");
        }
        do {
            food.x = Math.floor(Math.random() * nRows);
            food.y = Math.floor(Math.random() * nCols);
        } while (isOnSnake(food));
        id = "r" + food.x + "c" + food.y;
        $("#" + id).toggleClass("food");
    }

    eagleMove = function() {
        rand = Math.floor(Math.random() * 3) % 4;
        if (rand == 0) {
            randX = Math.floor(Math.random() * 4) % 3 - 1;
            randY = Math.floor(Math.random() * 4) % 3 - 1;
            eDir = {x: randX, y: randY};
        } else {
            eDir = eagleBestDir();
        }
        newX = eagle.x + eDir.x;
        newY = eagle.y + eDir.y;
        if (!(newX >= 0 && newX < nRows && newY >= 0 && newY < nCols)) {
            return;
        }
        id = "r" + eagle.x + "c" + eagle.y;
        $("#" + id).toggleClass("eagle");

        eagle.x = newX;
        eagle.y = newY;
        id = "r" + eagle.x + "c" + eagle.y;
        $("#" + id).toggleClass("eagle");
    }

    eagleBestDir = function() {
        up = {x: -1, y : 0};
        down = {x: 1, y : 0};
        left = {x: 0, y : 1};
        right = {x: 0, y : -1};
        upDist = distToSnake(newPos(eagle, up));
        downDist = distToSnake(newPos(eagle, down));
        leftDist = distToSnake(newPos(eagle, left));
        rightDist = distToSnake(newPos(eagle, right));
        minDist = Math.min(upDist, downDist, leftDist, rightDist);
        if (minDist == upDist) {
            return up;
        } else if (minDist == downDist) {
            return down;
        } else if (minDist == leftDist) {
            return left;
        } else {
            return right;
        }
    }

    newPos = function(oldPos, dir) {
        return {x: oldPos.x + dir.x, y: oldPos.y + dir.y};
    }

    distToSnake = function(pos) {
        return Math.sqrt(Math.pow(pos.x - snakeBody[0].x, 2) + Math.pow(pos.y - snakeBody[0].y, 2));
    }

    isOnSnake = function(food) {
        for (var i = 0; i < snakeBody.length; i++) {
            var snake = snakeBody[i];
            if ((food.x == snake.x) && (food.y == snake.y)) {
                return true;
            }
        }
        return false;
    }

    Template.leaderTemplate.helpers({
        scores: function() {
            return Scores.find({}, {sort: {score: -1}, limit: 10});
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}

Meteor.methods({
    shuffle: function(o) {
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    },
    generateList: function(end) {
        var result = [];
        for (var i = 1; i != end; ++i) {
            result.push(i);
        }
        return result;
    },
    setup: function() {
        var size = 12;

        var picList = generateList(size);
        picList = shuffle(picList);
        var randIndex = Math.ceil(Math.random() * size);
        for (var i = 0; i < picList.length; i++) {

        }
        Pictures.insert({link: "androids/" + randIndex + ".gif", index: randIndex});
    },

});
