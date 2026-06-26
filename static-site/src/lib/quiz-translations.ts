// SPDX-License-Identifier: AGPL-3.0-only
import type { QuizFilters, QuizItem } from "./types";

const itemText: Record<string, string> = {
  "WS2-01": "During the week, I can set aside 3+ hours for a student group.",
  "WS2-02": "I also have time for group meetings on weekends.",
  "WS2-03": "I would like to take responsibility in the group, for example project lead or board work.",
  "WS2-04": "Intercultural exchange and international members are important to me.",
  "WS2-05": "I prefer learning by doing over theory and discussion.",
  "WS2-06": "Strategic planning and conceptual work suit me just as much as hands-on implementation.",
  "WS2-07": "I want to work toward a concrete goal with a clear timeline.",
  "WS2-08": "I prefer a small, closely connected group over a large community.",
  "WS2-09": "Regular weekly meetings are important to me; I like commitment.",
  "WS2-10": "It is important to me that the group helps my future career through contacts or practical experience.",
  "WS2-11": "Membership fees or equipment costs above 50 euros per semester would be okay for me.",
  "WS2-12": "I would like to support disadvantaged or marginalized groups.",
  "WS2-13": "It is important to me that I can directly help other people in the group.",
  "WS2-14": "Sustainability and ecological action are important to me in a group.",
  "WS2-15": "A shared religious or worldview foundation is important to me.",
  "WS2-16": "An English-speaking group would be just as okay for me as a German-speaking one.",
  "WS2-17": "I would like to join right away without prior experience or a long onboarding process.",
  "WS2-18": "I am mainly looking for a group to make new friends.",
  "WS2-19": "I would like to take part in rankings, leaderboards or championships.",
  "WS2-20": "I prefer spending group time outdoors.",
  "WS2-21": "I would like to build my own projects or products in the group, from idea to implementation.",
};

const itemTitle: Record<string, string> = {
  "WS2-01": "Weekday time budget",
  "WS2-02": "Weekend time budget",
  "WS2-03": "Responsibility",
  "WS2-04": "Internationality",
  "WS2-05": "Hands-on learning style",
  "WS2-06": "Concept work",
  "WS2-07": "Goal orientation",
  "WS2-08": "Small group size",
  "WS2-09": "Meeting rhythm",
  "WS2-10": "Career relevance",
  "WS2-11": "Financial flexibility",
  "WS2-12": "Social engagement",
  "WS2-13": "Altruism",
  "WS2-14": "Sustainability",
  "WS2-15": "Religion / values",
  "WS2-16": "English language",
  "WS2-17": "Beginner-friendly",
  "WS2-18": "Friendships",
  "WS2-19": "Competition",
  "WS2-20": "Outdoor preference",
  "WS2-21": "Own projects / entrepreneurship",
};

const filterLabel: Record<string, string> = {
  "F-handsOn": "Hands-on building & workshops",
  "F-arts": "Creative work (theatre, film, writing, design, photography)",
  "F-competitive": "Taking part in competitions & championships",
  "F-music": "Making music",
  "F-outdoor": "Outdoor & nature (climbing, hiking, paddling)",
  "F-tech": "Tech & digital (coding, software, esports)",
  "F-party": "Student politics & participation",
  "F-sports": "Sports & movement",
};

export function translateQuizItems(items: QuizItem[]): QuizItem[] {
  return items.map((item) => ({
    ...item,
    text: itemText[item.id] ?? item.text,
    shortTitle: itemTitle[item.id] ?? item.shortTitle,
  }));
}

export function translateQuizFilters(filters: QuizFilters): QuizFilters {
  return {
    ...filters,
    question: "What would you mainly like to do in your student group?",
    subtitle: "",
    options: filters.options.map((option) => ({
      ...option,
      label: filterLabel[option.id] ?? option.label,
    })),
  };
}
