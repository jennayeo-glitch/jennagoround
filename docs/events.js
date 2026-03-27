// Events data
const eventsData = [
    {
        id: 9,
        date: '2026-04-04',
        displayDate: '2026.04.04',
        location: '탄천',
        meetupType: 'gathering',
        image: 'img/event/260404_butter_run.png',
        detailImage: 'img/event/260404_butter_run_poster2.png',
        alt: 'BUTTER RUN',
        title: 'BUTTER RUN',
        description: '버텨야돼 버터런\n막차 츌바알\n4/4 8AM - 11AM\n코스: 복정역 출발 - 야탑 - 정자 해산\n\n*PARTICIPATION MAY BE DIFFICULT IF ALLERGIC TO: RUNNING, BUTTER, CHERRY BLOSSOM, BAGEL OR SOCIALIZING.',
        capacity: { current: 0, total: 10 },
        status: 'Available',
        category: 'regular gathering'
    },
    {
        id: 1,
        date: '2026-02-21',
        displayDate: '2026.02.21',
        location: '강남구',
        image: 'img/event/jenna/260221_bdayparty.png',
        alt: 'Birthday Party',
        title: '여졍\'s 생월파티',
        description: '앗!녕 여러분♥︎\n희망 컨셉: 도파민 디톡스',
        /*
        여졍's 생월파티? 걱정 말아요
        요즘 도파민 디톡스를 시작했어요 — 시끌벅적한 자극은 잠시 내려놓고,
        조용히 우리끼리 맛있는 거 먹고 쉬어가요.
        이젠 우리 건강 생각해서 막차 타고 집에 가요.
        장소는 정해지면 알려줄게요♥︎
        */
        capacity: { current: 10, total: 10 },
        status: 'Sold Out',
        category: 'private party',
        preparation: '사랑 지갑',
        kakaoChatUrl: '',
        demoParticipants: [
            { id: 'demo-1', gender: 'female', ageGroup: '20대' },
            { id: 'demo-2', gender: 'male', ageGroup: '20대' },
            { id: 'demo-3', gender: 'female', ageGroup: '20대' },
            { id: 'demo-4', gender: 'male', ageGroup: '20대' },
            { id: 'demo-5', gender: 'female', ageGroup: '30대' },
            { id: 'demo-6', gender: 'male', ageGroup: '30대' },
            { id: 'demo-7', gender: 'female', ageGroup: '30대' },
            { id: 'demo-8', gender: 'male', ageGroup: '30대' },
            { id: 'demo-9', gender: 'female', ageGroup: '30대' },
            { id: 'demo-10', gender: 'male', ageGroup: '30대' }
        ]
    },
    {
        id: 2,
        date: '2026-02-13',
        displayDate: '2026.02.13',
        location: '영등포구',
        image: 'img/event/jenna/260213_wooyeon1.png',
        alt: 'Woo Yeon Event',
        capacity: { current: 30, total: 30 },
        status: 'Sold Out',
        category: 'regular gathering'
    },
    {
        id: 6,
        date: '2025-11-01',
        displayDate: '2025.11.01',
        location: '서초구',
        image: 'img/event/jenna/251101_case1101.jpeg',
        alt: 'Event Case 1101',
        capacity: { current: 100, total: 100 },
        status: 'Sold Out',
        category: 'private party'
    },
    {
        id: 6,
        date: '2025-08-30',
        displayDate: '2025.08.30',
        location: '송파구',
        image: 'img/event/chaejae/250830_jaespecialnight25.png',
        alt: 'Jae Special Night 25',
        capacity: { current: 50, total: 50 },
        status: 'Sold Out',
        category: 'private party'
    },
    {
        id: 6,
        date: '2024-11-01',
        displayDate: '2024.11.01',
        location: '용산구',
        image: 'img/event/jenna/241101_tot24.jpeg',
        alt: 'Event TOT 24',
        capacity: { current: 80, total: 80 },
        status: 'Sold Out',
        category: 'private party'
    },
    {
        id: 6,
        date: '2024-07-30',
        displayDate: '2024.07.30',
        location: '강남구',
        image: 'img/event/chaejae/240730_jaespecialnight24.png',
        alt: 'Jae Special Night 24',
        capacity: { current: 40, total: 40 },
        status: 'Sold Out',
        category: 'private party'
    },
    {
        id: 6,
        date: '2022-10-29',
        displayDate: '2022.10.29',
        location: '용산구',
        image: 'img/event/jenna/221029_tot22.png',
        alt: 'Event TOT 22',
        capacity: { current: 60, total: 60 },
        status: 'Sold Out',
        category: 'private party'
    },
    {
        id: 7,
        date: '2021-10-29',
        displayDate: '2021.10.29',
        location: '용산구',
        image: 'img/event/jenna/20211029_halloween.JPG',
        alt: 'Halloween Party',
        capacity: { current: 8, total: 8 },
        status: 'Sold Out',
        category: 'private party'
    }
];

// Sort events by date (newest first)
eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));

