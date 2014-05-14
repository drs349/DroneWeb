function p=map(radius)
addpath('distmesh');
v=readcoordinates('~/Desktop/Polygon.txt');
v=pi/180*(v-repmat([v(1,1),v(1,2)],size(v,1),1))*earthRadius;
[p,t]=distmesh2d(@dpoly,@huniform,radius,[min(v(:,1)),min(v(:,2)); max(v(:,1)),max(v(:,2))],v,v);
figure
title('Base Station positioning')
xlabel('East-West [m]')
ylabel('South-North [m]');
voronoi(p(:,1),p(:,2),t); hold on;
plot(v(:,1),v(:,2),'r'); hold on;