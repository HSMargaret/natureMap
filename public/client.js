let map;
const markersData = {}; // 마커 ID를 키로 설명을 저장하는 객체

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.5665, lng: 126.9780 }, // 서울 중심 좌표
        zoom: 13,
        gestureHandling: 'greedy', // 모바일에서 터치 이벤트가 잘 반응하도록 설정
    });

    // 서버에서 모든 마커 데이터를 가져와 지도에 표시
    fetch('/getMarkers')
        .then(response => response.json())
        .then(data => {
            data.markers.forEach(markerData => {
                addMarker({
                    lat: markerData.lat,
                    lng: markerData.lng,
                    description: markerData.description,
                    id: markerData.id
                }, false);  // 기존 마커 불러오기
            });
        })
        .catch(error => {
            console.error("Error fetching markers:", error);
        });

    map.addListener("click", (event) => {
        addMarker({ lat: event.latLng.lat(), lng: event.latLng.lng() }, true);  // 새로운 마커 추가
    });
}

function addMarker({ lat, lng, description = "", id }, isNew) {
    let markerId = id || `marker_${Date.now()}`;
    const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map
    });

    markersData[markerId] = description;

    const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(marker, markerId, isNew),
    });

    marker.addListener("click", () => {
        infoWindow.setContent(createInfoWindowContent(marker, markerId, false));
        infoWindow.open(map, marker);
    });

    // 새로 추가된 마커라면 바로 정보창 열기
    if (isNew) {
        infoWindow.open(map, marker);
    }
}

function createInfoWindowContent(marker, markerId, isNew) {
    const div = document.createElement("div");
    div.classList.add("info-window");

    const textarea = document.createElement("textarea");
    textarea.placeholder = "위치에 대한 설명을 입력하세요...";
    textarea.value = markersData[markerId] || ""; // 저장된 설명을 불러옴
    div.appendChild(textarea);

    const saveButton = document.createElement("button");
    saveButton.textContent = "저장";
    saveButton.onclick = () => {
        markersData[markerId] = textarea.value;
    
        console.log("Save button clicked"); // 로그 추가
        console.log("Saving data:", {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng(),
            description: textarea.value
        });
    
        if (isNew) {
            fetch('/addMarker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat: marker.getPosition().lat(),  // 위도
                    lng: marker.getPosition().lng(),  // 경도
                    description: textarea.value        // 설명
                })
            }).then(response => {
                console.log("Response received:", response); // 로그 추가
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                console.log("Data received:", data); // 데이터 로그 추가
                markerId = data.id; // 서버에서 반환된 ID를 사용하여 markerId 업데이트
                alert("설명이 저장되었습니다.");
            })
            .catch(error => {
                console.error("Error:", error);
                alert("설명을 저장하는 데 실패했습니다.");
            });
        } else {
            alert("설명이 업데이트되었습니다.");
        }
    };
    
    div.appendChild(saveButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.style.marginLeft = "5px";
    deleteButton.onclick = () => {
        marker.setMap(null); // 마커 삭제
        delete markersData[markerId]; // 설명 데이터 삭제

        // 서버에 마커 삭제 요청
        fetch('/deleteMarker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: markerId })
        }).then(response => response.json())
          .then(data => {
              if (data.deleted) {
                  alert("마커가 삭제되었습니다.");
              } else {
                  alert("마커를 삭제하는 데 실패했습니다.");
              }
          })
          .catch(error => {
              console.error("Error:", error);
              alert("마커를 삭제하는 데 실패했습니다.");
          });
    };
    div.appendChild(deleteButton);

    return div;
}
