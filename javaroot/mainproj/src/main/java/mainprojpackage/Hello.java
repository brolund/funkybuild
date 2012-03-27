package mainprojpackage;

import subprojpackage.HellosDependency;

public class Hello {
	public String g = "Dependency says: " + new HellosDependency().g;
	public static void main(String[] args) {
		System.out.println(new Hello().g);
	} 
}