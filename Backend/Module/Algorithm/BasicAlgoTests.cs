using NUnit.Framework;
using OpenCvSharp;

namespace HksScript.Algorithms.Tests;

[TestFixture]
public class BasicAlgoTests
{
    [Test]
    public void CreateMat()
    {
        using var img = new Mat(10, 10, MatType.CV_8UC3, new Scalar(0, 0, 0));
        Assert.AreEqual(10, img.Width);
        Assert.AreEqual(10, img.Height);
        Assert.IsFalse(img.Empty());
    }

    [Test]
    public void Gray()
    {
        using var src = new Mat(10, 10, MatType.CV_8UC3, new Scalar(100, 150, 200));
        using var dst = BasicAlgo.Gray(src);
        Assert.AreEqual(1, dst.Channels());
        Assert.AreEqual(10, dst.Width);
    }

    [Test]
    public void GaussianBlur()
    {
        using var src = new Mat(20, 20, MatType.CV_8UC1, new Scalar(50));
        using var dst = BasicAlgo.GaussianBlur(src, 1.0);
        Assert.AreEqual(src.Size(), dst.Size());
    }

    [Test]
    public void MedianBlur()
    {
        using var src = new Mat(20, 20, MatType.CV_8UC1, new Scalar(50));
        using var dst = BasicAlgo.MedianBlur(src, 3);
        Assert.AreEqual(src.Size(), dst.Size());
    }

    [Test]
    public void Canny()
    {
        using var src = new Mat(20, 20, MatType.CV_8UC1, new Scalar(100));
        using var dst = BasicAlgo.Canny(src, 50, 150);
        Assert.AreEqual(src.Size(), dst.Size());
        Assert.AreEqual(1, dst.Channels());
    }

    [Test]
    public void Erode_Dilate()
    {
        using var src = new Mat(20, 20, MatType.CV_8UC1, new Scalar(255));
        using var eroded = BasicAlgo.Erode(src, 3);
        using var dilated = BasicAlgo.Dilate(eroded, 3);
        Assert.AreEqual(src.Size(), dilated.Size());
    }

    [Test]
    public void Threshold()
    {
        using var src = new Mat(10, 10, MatType.CV_8UC1, new Scalar(128));
        using var dst = BasicAlgo.Threshold(src, 100, 255);
        Assert.AreEqual(1, dst.Channels());
        // 128 > 100 → 全白
        Assert.AreEqual(255, dst.At<byte>(0, 0));
    }

    [Test]
    public void Resize()
    {
        using var src = new Mat(100, 100, MatType.CV_8UC1, new Scalar(0));
        using var dst = BasicAlgo.Resize(src, 0.5);
        Assert.AreEqual(50, dst.Width);
        Assert.AreEqual(50, dst.Height);
    }
}
