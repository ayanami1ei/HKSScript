using OpenCvSharp;
using HksScript.Interpreter;

namespace HksScript.Algorithms;

public static class ModuleInit
{
    public static void RegisterAll(FunctionTable table)
    {
        table.Register("gray", new ExternalFunction("gray",
            args => BasicAlgo.Gray((Mat)args[0]!)));

        table.Register("gaussian_blur", new ExternalFunction("gaussian_blur",
            args => BasicAlgo.GaussianBlur((Mat)args[0]!, (double)args[1]!)));

        table.Register("median_blur", new ExternalFunction("median_blur",
            args => BasicAlgo.MedianBlur((Mat)args[0]!, (int)args[1]!)));

        table.Register("canny", new ExternalFunction("canny",
            args => BasicAlgo.Canny((Mat)args[0]!, (double)args[1]!, (double)args[2]!)));

        table.Register("erode", new ExternalFunction("erode",
            args => BasicAlgo.Erode((Mat)args[0]!, (int)args[1]!)));

        table.Register("dilate", new ExternalFunction("dilate",
            args => BasicAlgo.Dilate((Mat)args[0]!, (int)args[1]!)));

        table.Register("threshold", new ExternalFunction("threshold",
            args => BasicAlgo.Threshold((Mat)args[0]!, (double)args[1]!, (double)args[2]!)));

        table.Register("hough_circles", new ExternalFunction("hough_circles",
            args => BasicAlgo.HoughCircles((Mat)args[0]!, (double)args[1]!, (double)args[2]!)));

        table.Register("resize", new ExternalFunction("resize",
            args => BasicAlgo.Resize((Mat)args[0]!, (double)args[1]!)));

        table.Register("imread", new ExternalFunction("imread",
            args => BasicAlgo.ImRead((string)args[0]!)));

        table.Register("imwrite", new ExternalFunction("imwrite",
            args => { BasicAlgo.ImWrite((string)args[0]!, (Mat)args[1]!); return null; }));

        table.Register("__init_basic", new ExternalFunction("__init_basic",
            _ => { RegisterAll(table); return null; }));
    }
}
