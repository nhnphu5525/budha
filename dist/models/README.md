# Hướng Dẫn Tải & Tùy Biến Model 3D Nhân Vật (.GLB)

Thư mục này chứa file mô hình 3D thực tế của Phật Tử được load động vào ứng dụng thông qua hook `useGLTF` và `useAnimations` từ `@react-three/drei`.

## 1. Đường dẫn file mặc định:
```
public/models/devotee.glb
```
Vite sẽ tự động phục vụ file này tại URL: `/models/devotee.glb`.

## 2. Cách thay thế bằng model của bạn:
Bạn có thể tải hoặc xuất model từ **Mixamo**, **Blender**, **Ready Player Me**, hoặc **Sketchfab**:
1. Đặt tên file là `devotee.glb` và sao chép đè vào thư mục `public/models/`.
2. Ứng dụng sẽ tự động tải model mới thông qua `useGLTF('/models/devotee.glb')`.

## 3. Quy ước Animation Clips (nếu có nhúng animation):
Component `HumanoidDevotee` tự động nhận diện và cross-fade chuyển đổi animation pose mượt mà:
- **Tư thế Ngồi Thiền**: Animation clip có tên chứa một trong các từ: `meditate`, `sitting`, `lotus`, `sit`.
- **Tư thế Đứng Chắp Tay**: Animation clip có tên chứa một trong các từ: `pray`, `standing`, `idle`, `anjali`.
- **Tư thế Lạy Phật**: Animation clip có tên chứa: `bow`.

## 4. Quy ước Xương (Skeletal Bones) nếu là model Rigged tĩnh (không có sẵn clip):
Nếu model là Rigged humanoid nhưng chưa nướng clip, hệ thống sẽ tự động tìm các bone chuẩn (Mixamo / Humanoid):
- `Hips` / `Pelvis`
- `Spine`, `Chest`, `Neck`, `Head`
- `LeftArm`, `RightArm`, `LeftForeArm`, `RightForeArm`
- `LeftUpLeg`, `RightUpLeg`, `LeftLeg`, `RightLeg`
Và tự động tạo dáng chuẩn (xếp bằng kiết già hoặc chắp tay búp sen).

## 5. Tự động đổi màu y phục (Robe Color):
Mọi mesh hoặc material có tên chứa `robe`, `cloth`, `outfit`, `torso` sẽ tự động được gán màu theo sắc phục áo tràng người dùng chọn trong giao diện (Áo Lam, Áo Nâu, Bạch Y, Hoàng Y...).

## 6. Lệnh tạo lại file mẫu (Placeholder):
Nếu bạn muốn tạo lại file mẫu chuẩn ban đầu:
```bash
npm run generate:model
```
