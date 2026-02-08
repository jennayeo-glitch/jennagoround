# Firebase 설정 가이드

이 프로젝트는 Firebase Firestore를 사용하여 참여자 데이터를 실시간으로 관리합니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `ppl-person`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Firestore 데이터베이스 생성

1. Firebase Console에서 생성한 프로젝트 선택
2. 왼쪽 메뉴에서 "Firestore Database" 클릭
3. "데이터베이스 만들기" 클릭
4. **프로덕션 모드** 선택 (나중에 보안 규칙 수정 가능)
5. 위치 선택 (예: `asia-northeast3` - 서울)
6. "사용 설정" 클릭

## 3. Firebase 설정 정보 가져오기

1. Firebase Console에서 프로젝트 설정(톱니바퀴 아이콘) 클릭
2. "프로젝트 설정" 페이지로 이동
3. "일반" 탭에서 "내 앱" 섹션으로 스크롤
4. 웹 앱 추가 (</> 아이콘) 클릭
5. 앱 닉네임 입력 (예: `ppl-person-web`)
6. "Firebase Hosting도 설정" 체크 해제 (GitHub Pages 사용)
7. "앱 등록" 클릭
8. **Firebase SDK 설정 정보 복사**:
   ```javascript
   const firebaseConfig = {
       apiKey: "AIza...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
   };
   ```

## 4. 프로젝트에 Firebase 설정 적용

1. `firebase.js` 파일 열기
2. `firebaseConfig` 객체의 값들을 위에서 복사한 값으로 교체:
   ```javascript
   const firebaseConfig = {
       apiKey: "여기에_API_KEY_입력",
       authDomain: "여기에_AUTH_DOMAIN_입력",
       projectId: "여기에_PROJECT_ID_입력",
       storageBucket: "여기에_STORAGE_BUCKET_입력",
       messagingSenderId: "여기에_MESSAGING_SENDER_ID_입력",
       appId: "여기에_APP_ID_입력"
   };
   ```

## 5. Firestore 보안 규칙 설정 (선택사항)

기본적으로 모든 사용자가 읽고 쓸 수 있도록 설정되어 있습니다. 프로덕션 환경에서는 보안 규칙을 설정하는 것을 권장합니다.

1. Firestore Database > "규칙" 탭 클릭
2. 다음 규칙으로 교체 (모든 사용자가 읽고 쓸 수 있음):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /events/{eventId} {
         allow read, write: if true;
       }
     }
   }
   ```
3. "게시" 클릭

**더 안전한 규칙 (권장)**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // 모든 사용자가 읽을 수 있음
      allow read: if true;
      // 참여자 추가/제거만 허용 (문서 전체 수정 불가)
      allow write: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['participants', 'updatedAt']);
    }
  }
}
```

## 6. 배포된 사이트에 Firebase 도메인 추가

GitHub Pages에 배포한 경우, Firebase Console에서 허용된 도메인을 추가해야 합니다:

1. Firebase Console > 프로젝트 설정 > "일반" 탭
2. "승인된 도메인" 섹션으로 스크롤
3. "도메인 추가" 클릭
4. 배포된 도메인 입력: `jennayeo-glitch.github.io`
5. "추가" 클릭

## 7. 테스트

1. 로컬에서 `npm run dev` 실행
2. 이벤트 상세 페이지로 이동
3. 카카오 로그인 후 "참여하기" 버튼 클릭
4. Firebase Console > Firestore Database에서 데이터 확인:
   - `events` 컬렉션
   - `event_1` 문서 (이벤트 ID가 1인 경우)
   - `participants` 배열에 참여자 정보가 저장되어 있는지 확인

## 8. 배포

Firebase 설정이 완료되면:

1. `npm run build` 실행
2. `docs` 폴더에 빌드된 파일 복사
3. Git에 커밋 및 푸시:
   ```bash
   cp -r dist/* docs/
   git add docs/
   git commit -m "Update docs with Firebase integration"
   git push
   ```

## 문제 해결

### Firebase가 초기화되지 않음
- `firebase.js`의 `firebaseConfig` 값이 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 데이터가 저장되지 않음
- Firestore 보안 규칙 확인
- Firebase Console에서 데이터베이스가 생성되었는지 확인

### 실시간 업데이트가 작동하지 않음
- Firebase SDK가 올바르게 로드되었는지 확인
- 브라우저 콘솔에서 네트워크 에러 확인

## 참고

- Firebase 무료 플랜(Spark)은 충분한 용량을 제공합니다
- 일일 읽기/쓰기 제한: 50,000회
- 저장 공간: 1GB
- 자세한 내용: [Firebase 가격](https://firebase.google.com/pricing)

