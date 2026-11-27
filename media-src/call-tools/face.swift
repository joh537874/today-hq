// 장면 폴더의 각 장면에서 얼굴 상자(x,y,w,h, 픽셀, 위가 0)를 출력한다.
import Foundation
import Vision
import CoreImage
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".png") }.sorted()
for f in files {
    guard let img = CIImage(contentsOf: dir.appendingPathComponent(f)) else { continue }
    let req = VNDetectFaceLandmarksRequest()
    try VNImageRequestHandler(ciImage: img).perform([req])
    guard let face = req.results?.first else { print(f, "none"); continue }
    let W = img.extent.width, H = img.extent.height, b = face.boundingBox
    var ey = 0.0
    if let l = face.landmarks?.leftPupil, let r = face.landmarks?.rightPupil {
        let p = (l.pointsInImage(imageSize: CGSize(width: W, height: H)) + r.pointsInImage(imageSize: CGSize(width: W, height: H)))
        ey = H - p.map { Double($0.y) }.reduce(0, +) / Double(p.count)
    }
    print(f, String(format: "%.1f %.1f %.1f %.1f eye %.1f", b.minX*W, H-b.maxY*H, b.width*W, b.height*H, ey))
}
