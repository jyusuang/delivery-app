"use client";

import { useState } from "react";

type Menu = {
  id: number;
  name: string;
  price: number;
  restaurantId: number;
};

type Restaurant = {
  id: number;
  name: string;
  category: string;
  menus: Menu[];
};

type User = {
  id: number;
  email: string;
} | null;

type CartItem = {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
};

type OrderItem = {
  id: number;
  quantity: number;
  menu: {
    id: number;
    name: string;
    price: number;
    restaurant?: {
      id: number;
      name: string;
      category: string;
    };
  };
};

type Order = {
  id: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type DeliveryAppProps = {
  restaurants: Restaurant[];
  user: User;
};

export default function DeliveryApp({ restaurants, user }: DeliveryAppProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number>(
    restaurants[0]?.id ?? 0
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

  const selectedRestaurant = restaurants.find((restaurant) => {
    return restaurant.id === selectedRestaurantId;
  });

  const cartTotalPrice = cart.reduce((sum: number, item: CartItem) => {
    return sum + item.price * item.quantity;
  }, 0);

  async function handleSignup() {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      setCurrentUser(data.user);
      setEmail("");
      setPassword("");
      setOrders([]);
      setCart([]);
    }
  }

  async function handleLogin() {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      setCurrentUser(data.user);
      setEmail("");
      setPassword("");
      setOrders([]);
      setCart([]);
    }
  }

  async function handleLogout() {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    const data = await response.json();

    setMessage(data.message);
    setCurrentUser(null);
    setCart([]);
    setOrders([]);
  }

  function addToCart(menu: Menu) {
    const existingItem = cart.find((item) => {
      return item.menuId === menu.id;
    });

    if (existingItem) {
      const nextCart = cart.map((item) => {
        if (item.menuId === menu.id) {
          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }

        return item;
      });

      setCart(nextCart);
    } else {
      setCart([
        ...cart,
        {
          menuId: menu.id,
          name: menu.name,
          price: menu.price,
          quantity: 1,
        },
      ]);
    }

    setMessage(`${menu.name} 장바구니에 담기 완료`);
  }

  function removeFromCart(menuId: number) {
    const nextCart = cart.filter((item) => {
      return item.menuId !== menuId;
    });

    setCart(nextCart);
  }

  async function placeOrder() {
    if (!currentUser) {
      setMessage("주문하려면 로그인이 필요합니다.");
      return;
    }

    if (cart.length === 0) {
      setMessage("장바구니가 비어 있습니다.");
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      setCart([]);
      await loadOrders();
    }
  }

  async function loadOrders() {
    if (!currentUser) {
      setMessage("로그인이 필요합니다.");
      return;
    }

    const response = await fetch("/api/orders");
    const data = await response.json();

    if (response.ok) {
      setOrders(data.orders);
      setMessage("주문 내역을 불러왔습니다.");
    } else {
      setMessage(data.message);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <p className="badge">컴퓨터과학개론 기말 프로젝트</p>
        <h1>배달앱 만들기</h1>
        <p>
          회원가입, 로그인, 식당 목록, 메뉴 목록, 장바구니, 주문하기, 주문
          내역 확인까지 한 번에 시연할 수 있는 배달앱입니다.
        </p>
      </section>

      {message ? <div className="message">{message}</div> : null}

      <section className="card">
        <h2>1. 회원 기능</h2>

        {currentUser ? (
          <div>
            <p>
              현재 로그인: <strong>{currentUser.email}</strong>
            </p>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <div className="form">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <div className="button-group">
              <button type="button" onClick={handleSignup}>
                회원가입
              </button>
              <button type="button" onClick={handleLogin}>
                로그인
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid">
        <div className="card">
          <h2>2. 식당 목록</h2>

          <div className="restaurant-list">
            {restaurants.map((restaurant) => (
              <button
                type="button"
                key={restaurant.id}
                className={
                  selectedRestaurantId === restaurant.id ? "selected" : ""
                }
                onClick={() => setSelectedRestaurantId(restaurant.id)}
              >
                {restaurant.name}
                <span>{restaurant.category}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>3. 메뉴 목록</h2>

          {selectedRestaurant ? (
            selectedRestaurant.menus.map((menu) => (
              <div className="menu-row" key={menu.id}>
                <div>
                  <strong>{menu.name}</strong>
                  <p>{menu.price.toLocaleString()}원</p>
                </div>

                <button type="button" onClick={() => addToCart(menu)}>
                  담기
                </button>
              </div>
            ))
          ) : (
            <p>식당을 선택해주세요.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>4. 장바구니</h2>

        {cart.length === 0 ? (
          <p>장바구니가 비어 있습니다.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div className="menu-row" key={item.menuId}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.price.toLocaleString()}원 × {item.quantity}개
                  </p>
                </div>

                <button type="button" onClick={() => removeFromCart(item.menuId)}>
                  삭제
                </button>
              </div>
            ))}

            <h3>총 금액: {cartTotalPrice.toLocaleString()}원</h3>

            <button type="button" onClick={placeOrder}>
              주문하기
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>5. 내 주문 내역</h2>

        <button type="button" onClick={loadOrders}>
          주문 내역 불러오기
        </button>

        {orders.length === 0 ? (
          <p>아직 불러온 주문 내역이 없습니다.</p>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <h3>주문번호 #{order.id}</h3>
                <p>상태: {order.status}</p>
                <p>총 금액: {order.totalPrice.toLocaleString()}원</p>

                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.menu.restaurant?.name ?? "식당"} -{" "}
                      {item.menu.name} × {item.quantity}개
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}