BEGIN TRANSACTION;

DELETE FROM events;
DELETE FROM attendees;

INSERT INTO events (id, title, date, location, description, image_url, capacity) 
VALUES 
('1', 'CommunityConf 2024', '2025年7月14日17:00', '東京', 'コミュニティの活動を祝う年次カンファレンス。
1年を総括するイベントです！', NULL, 100),
('2', 'UI/UXデザインワークショップ', '2025年7月21日19:00', 'オンライン', 'UI/UXデザインのテクニックを学ぶ', '/uiux-design.jpg', NULL),
('3', 'Reactハンズオンセミナー', '2025年7月28日16:00', 'オンライン', 'Reactの基礎から応用まで学ぶ', '/react-event.jpg', 5);

-- イベント参加者データの挿入
INSERT INTO attendees (id, event_id, email) 
VALUES 
-- イベント1 (22名)
('a1', '1', 'user1@example.com'),
('a2', '1', 'user2@example.com'),
('a3', '1', 'user3@example.com'),
('a4', '1', 'user4@example.com'),
('a5', '1', 'user5@example.com'),
('a6', '1', 'user6@example.com'),
('a7', '1', 'user7@example.com'),
('a8', '1', 'user8@example.com'),
('a9', '1', 'user9@example.com'),
('a10', '1', 'user10@example.com'),
('a11', '1', 'user11@example.com'),
('a12', '1', 'user12@example.com'),
('a13', '1', 'user13@example.com'),
('a14', '1', 'user14@example.com'),
('a15', '1', 'user15@example.com'),
('a16', '1', 'user16@example.com'),
('a17', '1', 'user17@example.com'),
('a18', '1', 'user18@example.com'),
('a19', '1', 'user19@example.com'),
('a20', '1', 'user20@example.com'),
('a21', '1', 'user21@example.com'),
('a22', '1', 'user22@example.com'),

-- イベント2 (15名)
('b1', '2', 'designer1@example.com'),
('b2', '2', 'designer2@example.com'),
('b3', '2', 'designer3@example.com'),
('b4', '2', 'designer4@example.com'),
('b5', '2', 'designer5@example.com'),
('b6', '2', 'designer6@example.com'),
('b7', '2', 'designer7@example.com'),
('b8', '2', 'designer8@example.com'),
('b9', '2', 'designer9@example.com'),
('b10', '2', 'designer10@example.com'),
('b11', '2', 'designer11@example.com'),
('b12', '2', 'designer12@example.com'),
('b13', '2', 'designer13@example.com'),
('b14', '2', 'designer14@example.com'),
('b15', '2', 'designer15@example.com'),

-- イベント3 (5名 - 満員になるよう)
('c1', '3', 'react1@example.com'),
('c2', '3', 'react2@example.com'),
('c3', '3', 'react3@example.com'),
('c4', '3', 'react4@example.com'),
('c5', '3', 'react5@example.com');

COMMIT;