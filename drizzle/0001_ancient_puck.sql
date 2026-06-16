CREATE TABLE `plantStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plantId` int NOT NULL,
	`weatherCondition` varchar(50) NOT NULL,
	`temperature` decimal(5,2),
	`humidity` int,
	`growthStage` int NOT NULL,
	`growthProgress` int NOT NULL,
	`health` int NOT NULL,
	`hydration` int NOT NULL,
	`photosynthesis` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plantStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`growthStage` int NOT NULL DEFAULT 0,
	`growthProgress` int NOT NULL DEFAULT 0,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`locationName` varchar(255),
	`health` int NOT NULL DEFAULT 100,
	`hydration` int NOT NULL DEFAULT 50,
	`photosynthesis` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastWatered` timestamp NOT NULL DEFAULT (now()),
	`lastSunExposed` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weatherLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`condition` varchar(50) NOT NULL,
	`temperature` decimal(5,2) NOT NULL,
	`humidity` int NOT NULL,
	`cloudCover` int NOT NULL,
	`rainProbability` int NOT NULL,
	`windSpeed` decimal(5,2),
	`rawData` json,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `weatherLogs_id` PRIMARY KEY(`id`)
);
