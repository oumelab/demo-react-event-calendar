export const UserInfo = {
  TWITTER_URL:"#",
  GITHUB_URL: "#",
  HANDLE_NAME: "your-handle",
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl?: string;
  attendees: number;
  capacity?: number;
}

export const EVENTS: Event[] = [
  {
    id: "1",
    title: "CommunityConf 2024",
    date: "2024年11月14日17:00",
    location: "東京",
    description:
      "コミュニティの活動を祝う年次カンファレンス。\n1年を総括するイベントです！",
    attendees: 42,
    capacity: 100,
  },
  {
    id: "2",
    title: "UI/UXデザインワークショップ",
    date: "2024年11月21日19:00",
    location: "オンライン",
    description: "UI/UXデザインのテクニックを学ぶ",
    imageUrl: "/uiux-design.jpg",
    attendees: 15,

  },
  {
    id: "3",
    title: "Reactハンズオンセミナー",
    date: "2024年11月28日16:00",
    location: "オンライン",
    description: "Reactの基礎から応用まで学ぶ",
    imageUrl: "/react-event.jpg",
    attendees: 5,
    capacity: 5,
  },
];