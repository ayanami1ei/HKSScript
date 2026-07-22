using OpenCvSharp;

namespace HksScript.Algorithms;

public static class BasicAlgo
{
    // 灰度化
    public static Mat Gray(Mat src)
    {
        var dst = new Mat();
        Cv2.CvtColor(src, dst, ColorConversionCodes.BGR2GRAY);
        return dst;
    }

    // 高斯滤波
    public static Mat GaussianBlur(Mat src, double sigma)
    {
        var dst = new Mat();
        int ksize = (int)(sigma * 3) | 1;  // 确保奇数
        Cv2.GaussianBlur(src, dst, new Size(ksize, ksize), sigma);
        return dst;
    }

    // 中值滤波
    public static Mat MedianBlur(Mat src, int ksize)
    {
        var dst = new Mat();
        Cv2.MedianBlur(src, dst, ksize | 1);  // 确保奇数
        return dst;
    }

    // Canny 边缘检测
    public static Mat Canny(Mat src, double threshold1, double threshold2)
    {
        var dst = new Mat();
        Cv2.Canny(src, dst, threshold1, threshold2);
        return dst;
    }

    // 腐蚀
    public static Mat Erode(Mat src, int kernelSize)
    {
        var dst = new Mat();
        var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(kernelSize, kernelSize));
        Cv2.Erode(src, dst, kernel);
        return dst;
    }

    // 膨胀
    public static Mat Dilate(Mat src, int kernelSize)
    {
        var dst = new Mat();
        var kernel = Cv2.GetStructuringElement(MorphShapes.Rect, new Size(kernelSize, kernelSize));
        Cv2.Dilate(src, dst, kernel);
        return dst;
    }

    // 阈值分割
    public static Mat Threshold(Mat src, double thresh, double maxval)
    {
        var dst = new Mat();
        Cv2.Threshold(src, dst, thresh, maxval, ThresholdTypes.Binary);
        return dst;
    }

    // 霍夫圆检测
    public static CircleSegment[] HoughCircles(Mat src, double dp, double minDist)
    {
        var gray = src.Type() == MatType.CV_8UC1 ? src : Gray(src);
        return Cv2.HoughCircles(gray, HoughModes.Gradient, dp, minDist);
    }

    // 图片缩放
    public static Mat Resize(Mat src, double scale)
    {
        var dst = new Mat();
        Cv2.Resize(src, dst, new Size(0, 0), scale, scale);
        return dst;
    }

    // 读取图像
    public static Mat ImRead(string path)
    {
        var img = Cv2.ImRead(path);
        if (img.Empty())
            throw new Exception($"无法读取图像: {path}");
        return img;
    }

    // 保存图像
    public static void ImWrite(string path, Mat img)
    {
        Cv2.ImWrite(path, img);
    }
}
