DROP DATABASE IF EXISTS ramio;
CREATE DATABASE ramio;

\c ramio;

CREATE TABLE IF NOT EXISTS players (
    pid SERIAL PRIMARY KEY,
    username VARCHAR(10),
    lastTimePlayed DATE
);

CREATE TABLE IF NOT EXISTS authentication (
    pid SERIAL PRIMARY KEY,
    salt VARCHAR(20) NOT NULL,
    hashedPassword varchar(20) NOT NULL,
    FOREIGN KEY (pid) REFERENCES players(pid)
);

CREATE TABLE IF NOT EXISTS currentGame (
    pid SERIAL,
    deaths INTEGER NOT NULL DEFAULT 0,
    highScore INTEGER NOT NULL DEFAULT 0,
    numberUpgrades INTEGER,
    FOREIGN KEY (pid) REFERENCES players(pid),
    PRIMARY KEY (pid, deaths)
);

CREATE TABLE IF NOT EXISTS gameHistory (
    pid SERIAL,
    sid INTEGER NOT NULL,
    deaths INTEGER NOT NULL,
    highScore INTEGER NOT NULL,
    mostUpgrades INTEGER,
    gameStart TIMESTAMP NOT NULL,
    FOREIGN KEY (pid) REFERENCES players(pid),
    PRIMARY KEY (pid, sid)
);