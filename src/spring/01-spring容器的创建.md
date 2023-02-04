---
title: 'Spring源码系列（一）——容器的创建'
icon: page
order: 1
author: luoliang
date: 2023-01-28
category:
  - spring
tag:
  - 源码
sticky: true
star: true
footer: false
copyright: No Copyright
editLink: false
comment: false

---

## 内容大纲
 1. 容器的创建  
 2. 读取器的创建  
 3. 扫描器的创建  
 4. 小结  
 5. 补充说明  
    1. BeanPostProcessor
    2. Spring中容器的属性说明


## 一、容器的创建
下面我们从容器的创建开始，逐步探索Spring的源码  
函数的入口
```java
 public static void main(String[] args) {
    // 创建容器
    AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(AppConfig.class);

    // 从容器中获取Bean
    IndexDao dao = annotationConfigApplicationContext.getBean(IndexDao.class);

    // 调用Bean的方法
    dao.query();
}
```
这里主要看 `AnnotationConfigApplicationContext` 这个类的构造函数
```java
public AnnotationConfigApplicationContext(Class<?>... annotatedClasses) {
    // 这里由于它有父类构造方法，故而先调用父类的构造方法，然后才会调用自己的构造方法
    this();
    register(annotatedClasses);
    refresh();
}
```
父类是 `GenericApplicationContext`,构造函数如下
```java
public GenericApplicationContext() {
    // 创建一个DefaultListableBeanFactory工厂
    this.beanFactory = new DefaultListableBeanFactory();
}
```
> 对于 DefaultListableBeanFactory ， 我们可以把它当成一个Spring容器

再看一下`AnnotationConfigApplicationContext` 这个类的无参构造函数 ,因为上面的函数调用了`this`.
```java
    // 创建一个 AnnotatedBeanDefinitionReader读取器，
    // 同时向容器中填加了6个Spring的后置处理器：BeanFactoryPostProcessor、BeanPostProcessor
    // 1. ConfigurationClassPostProcessor
		// 2. AutowiredAnnotationBeanPostProcessor
		// 3. CommonAnnotationBeanPostProcessor
		// 4. PersistenceAnnotationBeanPostProcessor
		// 5. EventListenerMethodProcessor
		// 6. DefaultEventListenerFactory
    this.reader = new AnnotatedBeanDefinitionReader(this);

    // 可以用来扫描包或者类，继而转换成BeanDefinition，但实际上我们扫描包工作不是这个scanner对象来完成的
    // 是spring自己new的一个ClassPathBeanDefinitionScanner
    // 这里的scanner仅仅是为了能够让程序员在外部调用AnnotationConfigApplicationContext对象的scan方法
    this.scanner = new ClassPathBeanDefinitionScanner(this);
```
这个无参的构造函数初始化了一个读取器和扫描器 。 

## 二、读取器的创建

## 三、扫描器的创建

## 四、小结

## 五、补充说明




