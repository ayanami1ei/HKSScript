public abstract class Pack<T>;
public class One<T>(T Value) : Pack<T>;
public class Many<T>(List<T> Values) : Pack<T>;