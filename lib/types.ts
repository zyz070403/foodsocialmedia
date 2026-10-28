export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ValeUser = {
  id: string;
  username: string;
  displayName: string;
  initials: string;
  avatarGradient: string;
  avatarUrl?: string;
  goal: string;
  mutuals?: number;
};

export type CommentItem = {
  id: string;
  username: string;
  body: string;
};

export type ValePost = Nutrition & {
  id: string;
  user: ValeUser;
  imageUrl: string;
  mealName: string;
  caption: string;
  aiEstimated: boolean;
  createdAt: string;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  comments: CommentItem[];
  category?: string;
  readTime?: string;
};
