// Events data
// meetupType: 지도 필터 — 'networking' | 'gathering' | 'small-group' (네트워킹 · 게더링 · 소모임)
// kakaoChatUrl: 카카오 오픈채팅 등 링크 — 비어 있으면 톡방 버튼은 보이지만 비활성(링크 넣으면 활성)
// demoParticipants: 상세 통계용 가상 참가자 — 있으면 성별·연령 막대에만 사용, 모집인원은 capacity 기준
// registrationOpen: true — Smore 스타일 참가신청서 사용
const eventsData = [
    {
        id: 11,
        date: '2026-06-19',
        displayDate: '2026.06.19',
        location: '서울',
        meetupType: 'networking',
        image: 'img/event/260619_finding_nangman.png',
        alt: 'FINDING NANGMAN',
        title: 'FINDING NANGMAN',
        description:
            '로테이션 소개팅에 낭만 한 스푼\n\n처음 보는 사람인데\n괜히 웃음이 나는 순간이 있잖아요.\n그게 오늘 밤일 수도 있어요 😊',
        capacity: { current: 0, total: 40 },
        status: 'Available',
        category: 'regular gathering',
        kakaoChatUrl: '',
        registrationOpen: true
    },
    {
        id: 10,
        date: '2026-06-13',
        displayDate: '2026.06.13',
        location: '서울 용산구',
        meetupType: 'gathering',
        image: 'img/event/260613_smc.png',
        alt: 'SMC Saturday Morning Crochet',
        title: 'SMC (Saturday Morning Crochet)',
        description:
            'Welcome to Saturday Morning Crochet\n안녕하세요 😊\n\n혼자 뜨개질하다가 어느새 셋이 모여 뜨개질을 하고있어요\n이 따뜻한 취미를 더 많은 분들과 함께 나누고 싶어 이번 이벤트를 열게 되었습니다 🧶✨\n\n뜨개질이 처음이어도 괜찮아요!\n그냥 관심만 있어도 충분합니다 ☺️\n\n이번 모임은 미국인 친구들과 함께 진행하는 소셜링 모임이라\n영어와 한국어를 자연스럽게 섞어 대화하며\n언어 교환과 문화 교류도 함께 즐길 수 있어요! (두근)\n\n각자의 진행하시던 작업물을 가져와도 좋고,\n가볍게 빈손으로 오셔도 괜찮아요!\n\n실과 바늘은 저희가 준비해둘게요 🙂',
        capacity: { current: 0, total: 24 },
        status: 'Available',
        category: 'regular gathering',
        kakaoChatUrl: '',
        registrationOpen: true
    },
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
        meetupType: 'small-group',
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
        preparation: '사랑과 지갑',
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
        category: 'regular gathering',
        meetupType: 'gathering'
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
        category: 'private party',
        meetupType: 'networking'
    },
    {
        id: 6,
        date: '2024-08-30',
        displayDate: '2024.08.30',
        location: '송파구',
        image: 'img/event/chaejae/240830_jaespecialnight25.png',
        alt: 'Jae Special Night 25',
        capacity: { current: 50, total: 50 },
        status: 'Sold Out',
        category: 'private party',
        meetupType: 'gathering'
    },
    {
        id: 8,
        date: '2025-10-18',
        displayDate: '2025.10.18',
        location: '용산구',
        image: 'img/event/chaejae/251018_jaespecialnight.png',
        alt: 'Jae Special Night',
        capacity: { current: 60, total: 60 },
        status: 'Sold Out',
        category: 'private party',
        meetupType: 'networking'
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
        category: 'private party',
        meetupType: 'small-group'
    },
    {
        id: 6,
        date: '2023-07-30',
        displayDate: '2023.07.30',
        location: '강남구',
        image: 'img/event/chaejae/230730_jaespecialnight24.png',
        alt: 'Jae Special Night 24',
        capacity: { current: 40, total: 40 },
        status: 'Sold Out',
        category: 'private party',
        meetupType: 'networking'
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
        category: 'private party',
        meetupType: 'small-group'
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
        category: 'private party',
        meetupType: 'gathering'
    }
];

// Sort events by date (newest first)
eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));

