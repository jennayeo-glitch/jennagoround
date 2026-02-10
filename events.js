// Events data
const eventsData = [
    {
        id: 1,
        date: '2026-02-21',
        displayDate: '2026.02.21',
        location: '강남구',
        image: 'img/event/jenna/260221_bdayparty.png',
        alt: 'Birthday Party',
        title: '여졍\'s 생월파티',
        description: '앗!녕 여러분♥︎\n여졍\'s 생월파티? 걱정말아요\n요즘 도파민디톡스 시작했어요\n조용하게 우리끼리 맛있는거 먹고 놀거에요\n이젠 우리 건강 생각해서 막차타고 집에가요\n장소는 정해지면 알려줄게요♥︎',
        capacity: { current: 0, total: 8 },
        status: 'Available',
        category: 'private party',
        preparation: '사랑과 지갑'
    },
    {
        id: 2,
        date: '2026-02-13',
        displayDate: '2026.02.13',
        location: '영등포구',
        image: 'img/event/jenna/260213_wooyeon1.png',
        alt: 'Woo Yeon Event',
        capacity: { current: 3, total: 30 },
        status: 'Available',
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
        id: 8,
        date: '2025-10-21',
        displayDate: '2025.10.21',
        location: '용산구',
        image: 'img/event/chaejae/251021_jaespecialnight.png',
        alt: 'Jae Special Night',
        capacity: { current: 60, total: 60 },
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
        image: 'img/event/jenna/20211029_halloween.png',
        alt: 'Halloween Party',
        capacity: { current: 8, total: 8 },
        status: 'Sold Out',
        category: 'private party'
    }
];

// Sort events by date (newest first)
eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));

