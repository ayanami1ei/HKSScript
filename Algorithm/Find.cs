/*
* 查找模块，根据函数不同做不同的查找功能，返回对应的结果
*/
public class Find
{
    public static List<Circle> FindCircle(Mat image)
    {
        Console.WriteLine("do something with image");

        List<Circle> circles = [];
        for (int i = 0; i < 10; i++)
        {
            circles.Add(new()
            {
                x = 1,
                y = 1,
                r = 3
            });
        }

        return circles;
    }
}