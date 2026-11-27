// 영상 한 장면을 꺼내 구석(배경)과 가운데(클로이)의 투명도를 출력한다.
import AVFoundation
import CoreGraphics
let asset = AVURLAsset(url: URL(fileURLWithPath: CommandLine.arguments[1]))
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
let sem = DispatchSemaphore(value: 0)
gen.generateCGImageAsynchronously(for: CMTime(seconds: 3, preferredTimescale: 600)) { img, _, err in
    guard let img = img else { print("err", err as Any); sem.signal(); return }
    let w = img.width, h = img.height
    var px = [UInt8](repeating: 0, count: w*h*4)
    let ctx = CGContext(data: &px, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w*4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    func a(_ x: Int, _ y: Int) -> UInt8 { px[(y*w+x)*4+3] }
    print("size \(w)x\(h) alphaInfo \(img.alphaInfo.rawValue) corner \(a(10,10)) center \(a(w/2,h/2))")
    sem.signal()
}
sem.wait()
