using System;

/// Stub Mat class replacing OpenCvSharp.Mat for demo purposes.
/// Replace with the real OpenCvSharp.Mat in production.
public class Mat
{
    public int Rows { get; set; }
    public int Cols { get; set; }
    public bool Empty { get; set; } = true;

    public Mat() { }

    public static Mat FromFile(string path)
    {
        Console.WriteLine($"    (stub) loading image: {path}");
        return new Mat { Rows = 480, Cols = 640, Empty = false };
    }
}
