import type { Question, FastMoneyQuestion } from '../types/game';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: 'Kể tên một món ăn sáng truyền thống quen thuộc nhất của người Việt Nam?',
    multiplier: 1,
    category: 'Ẩm thực',
    answers: [
      { id: 'q1_a1', text: 'Phở', points: 38 },
      { id: 'q1_a2', text: 'Bánh mì', points: 31 },
      { id: 'q1_a3', text: 'Xôi', points: 14 },
      { id: 'q1_a4', text: 'Cơm tấm', points: 8 },
      { id: 'q1_a5', text: 'Bún bò / Bún riêu', points: 5 },
      { id: 'q1_a6', text: 'Cháo lòng / Cháo hoa', points: 4 },
    ],
  },
  {
    id: 'q2',
    question: 'Khi đi làm trễ, người ta thường lấy lý do gì để giải thích với sếp?',
    multiplier: 1,
    category: 'Đời sống văn phòng',
    answers: [
      { id: 'q2_a1', text: 'Kẹt xe / Tắc đường', points: 42 },
      { id: 'q2_a2', text: 'Ngủ quên / Đồng hồ không reo', points: 26 },
      { id: 'q2_a3', text: 'Xe hỏng / Thủng lốp', points: 15 },
      { id: 'q2_a4', text: 'Trời mưa to ngập nước', points: 9 },
      { id: 'q2_a5', text: 'Bị ốm / Khó chịu trong người', points: 5 },
      { id: 'q2_a6', text: 'Gặp sự cố gia đình', points: 3 },
    ],
  },
  {
    id: 'q3',
    question: 'Một thứ mà hầu như ai cũng mang theo bên mình khi ra khỏi nhà?',
    multiplier: 2,
    category: 'Thói quen thường ngày',
    answers: [
      { id: 'q3_a1', text: 'Điện thoại di động', points: 45 },
      { id: 'q3_a2', text: 'Ví tiền / Bóp tiền', points: 25 },
      { id: 'q3_a3', text: 'Chìa khóa (nhà/xe)', points: 16 },
      { id: 'q3_a4', text: 'Khẩu trang', points: 8 },
      { id: 'q3_a5', text: 'Kính mắt', points: 4 },
      { id: 'q3_a6', text: 'Căn cước / Giấy tờ xe', points: 2 },
    ],
  },
  {
    id: 'q4',
    question: 'Hoạt động nào thường làm mất nhiều thời gian nhất của một người phụ nữ trước khi ra ngoài?',
    multiplier: 3,
    category: 'Cuộc sống',
    answers: [
      { id: 'q4_a1', text: 'Trang điểm (Makeup)', points: 48 },
      { id: 'q4_a2', text: 'Chọn & thử quần áo', points: 32 },
      { id: 'q4_a3', text: 'Làm tóc (sấy/uốn/duỗi)', points: 11 },
      { id: 'q4_a4', text: 'Chọn giày dép / Phụ kiện túi xách', points: 5 },
      { id: 'q4_a5', text: 'Chụp ảnh sống ảo / Soi gương', points: 4 },
    ],
  },
  {
    id: 'q5',
    question: 'Món quà mà các cặp đôi hay tặng nhau nhất vào ngày lễ tình nhân (Valentine)?',
    multiplier: 2,
    category: 'Tình yêu',
    answers: [
      { id: 'q5_a1', text: 'Chocolate (Sô cô la)', points: 46 },
      { id: 'q5_a2', text: 'Hoa hồng / Bó hoa tươi', points: 34 },
      { id: 'q5_a3', text: 'Gấu bông', points: 9 },
      { id: 'q5_a4', text: 'Nước hoa / Son môi', points: 6 },
      { id: 'q5_a5', text: 'Trang sức (nhẫn/dây chuyền)', points: 5 },
    ],
  },
  {
    id: 'q6',
    question: 'Người Việt Nam thường làm gì đầu tiên khi vừa ngủ dậy?',
    multiplier: 1,
    category: 'Thói quen',
    answers: [
      { id: 'q6_a1', text: 'Cầm điện thoại lướt mạng', points: 41 },
      { id: 'q6_a2', text: 'Đi vệ sinh / Rửa mặt', points: 28 },
      { id: 'q6_a3', text: 'Uống một cốc nước', points: 14 },
      { id: 'q6_a4', text: 'Đánh răng', points: 10 },
      { id: 'q6_a5', text: 'Vươn vai / Tập thể dục', points: 7 },
    ],
  },
];

export const DEFAULT_FAST_MONEY_QUESTIONS: FastMoneyQuestion[] = [
  {
    id: 'fm1',
    question: 'Một con số từ 1 đến 10 mà bạn nghĩ đến đầu tiên?',
    answers: [
      { text: '7', points: 36 },
      { text: '1', points: 22 },
      { text: '5', points: 18 },
      { text: '3', points: 12 },
      { text: '10', points: 8 },
      { text: '8', points: 4 },
    ],
  },
  {
    id: 'fm2',
    question: 'Một loài vật thường được nuôi làm thú cưng trong nhà?',
    answers: [
      { text: 'Chó', points: 54 },
      { text: 'Mèo', points: 35 },
      { text: 'Chim', points: 5 },
      { text: 'Cá cảnh', points: 4 },
      { text: 'Hamster / Chuột cảnh', points: 2 },
    ],
  },
  {
    id: 'fm3',
    question: 'Độ tuổi mà người ta thường bắt đầu kết hôn nhiều nhất?',
    answers: [
      { text: '25 tuổi', points: 34 },
      { text: '27 tuổi', points: 26 },
      { text: '28 tuổi', points: 20 },
      { text: '30 tuổi', points: 12 },
      { text: '24 tuổi', points: 8 },
    ],
  },
  {
    id: 'fm4',
    question: 'Thứ bạn không thể thiếu khi đi du lịch biển mùa hè?',
    answers: [
      { text: 'Đồ bơi / Bikini', points: 38 },
      { text: 'Kem chống nắng', points: 31 },
      { text: 'Kính râm / Kính mát', points: 16 },
      { text: 'Mũ cói / Nón rộng vành', points: 9 },
      { text: 'Điện thoại / Máy ảnh', points: 6 },
    ],
  },
  {
    id: 'fm5',
    question: 'Một loại trái cây có nhiều nước nhất?',
    answers: [
      { text: 'Dưa hấu', points: 58 },
      { text: 'Dừa', points: 19 },
      { text: 'Cam / Quýt', points: 12 },
      { text: 'Bưởi', points: 6 },
      { text: 'Thơm (Dứa)', points: 5 },
    ],
  },
];
