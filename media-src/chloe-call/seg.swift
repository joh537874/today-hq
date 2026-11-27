// 사진 폴더의 각 장면에서 사람 영역만 흑백 가면(흰색=사람)으로 뽑는다. macOS 기본 비전 기능 사용.
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let inDir = URL(fileURLWithPath: args[1]), outDir = URL(fileURLWithPath: args[2])
let ctx = CIContext()
let files = try FileManager.default.contentsOfDirectory(atPath: inDir.path).filter { $0.hasSuffix(".png") }.sorted()
for f in files {
    let url = inDir.appendingPathComponent(f)
    guard let img = CIImage(contentsOf: url) else { continue }
    let req = VNGeneratePersonSegmentationRequest()
    req.qualityLevel = .accurate
    req.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try VNImageRequestHandler(ciImage: img).perform([req])
    guard let buf = req.results?.first?.pixelBuffer else { continue }
    var m = CIImage(cvPixelBuffer: buf)
    m = m.transformed(by: CGAffineTransform(scaleX: img.extent.width / m.extent.width, y: img.extent.height / m.extent.height))
    let cg = ctx.createCGImage(m, from: img.extent)!
    let rep = NSBitmapImageRep(cgImage: cg)
    try rep.representation(using: .png, properties: [:])!.write(to: outDir.appendingPathComponent(f))
}
print("done \(files.count)")
