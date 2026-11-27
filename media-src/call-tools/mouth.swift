// 장면마다 입이 벌어진 정도(안쪽 입술 높이 / 얼굴 높이)를 출력한다. macOS 기본 얼굴 인식 사용.
import Foundation
import Vision
import CoreImage
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".png") }.sorted()
for f in files {
    guard let img = CIImage(contentsOf: dir.appendingPathComponent(f)) else { print("0"); continue }
    let req = VNDetectFaceLandmarksRequest()
    try VNImageRequestHandler(ciImage: img).perform([req])
    guard let face = req.results?.first, let lips = face.landmarks?.innerLips else { print("0"); continue }
    let ys = lips.normalizedPoints.map { $0.y }
    print(String(format: "%.4f", (ys.max()! - ys.min()!)))
}
