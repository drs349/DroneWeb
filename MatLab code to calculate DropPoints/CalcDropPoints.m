%function that takes a set of points representig the vertices of a polygon
%to caclulate optimized coverage
%Input format should be a matrix of the below form:
%[[latt1 lon1]
%[latt2 lon2]
%[latt3 lon3]
%...
%[lattN lonN]]

%output is a matrix of the same format

%%TODO:
%   Implement CalcR function

function [waypoints, WPstring] = CalcDropPointsTest(pos)

% CHANGE TO LOCATION OF DOMAIN OPTIMIZATION FOLDER ON COMPUTER USED

addpath '/Users/zackbright/Documents/MATLAB/Domain Optimization/';
pyname = 'Sorting_Methods_Reduced_SERVER_Implement.py';

pos = [pos; pos(1,:)];

pos_xy = pi/180.0*(pos-repmat([pos(1,1),pos(1,2)],size(pos,1),1))*earthRadius;

Krad = 1.68; %%%calibration constant for the lengthening of line segments in distmesh


%%%%%-----------------------%%%%
%%% NEEDS TO BE IMPLEMENTED %%%
radius = 3; %calcR(chemical, temp, wind, humidity);
%r = calcR2(chemical,time,Temp) %<---- current implementation
%%%%%----------------------%%%%

temp = [];
figure;

x=[0 0];

for i = [1:size(pos_xy(:,1))]
x(1) = x(1) + pos_xy(i,1);
x(2) = x(2) + pos_xy(i,2);
z=i;
end

x= x/z;

plot(x(1), x(2));

vec = pos_xy - repmat(x, size(pos_xy(:,1)));

vecN = [0 0];
for i = 1:size(vec(:,1))
vecN(i,:) = vec(i,:)/sqrt(vec(i,1)^2 + vec(i,2)^2);
end

pos2 = pos_xy - vecN*radius/Krad;

pos2 = [pos2; pos2(size(pos2(:,1)),:)];
pos_xy = [pos_xy; pos_xy(size(pos_xy(:,1)),:)];

[p,t]=distmesh2d(@dpoly,@huniform,Krad*radius,[min(pos2(:,1)),min(pos2(:,2)); max(pos2(:,1)),max(pos2(:,2))],pos2,pos2);
close(gcf);
p_deg= 180.0/pi*(p)/earthRadius +repmat([pos(1,1),pos(1,2)],size(p,1),1);

waypoints = p_deg;
new = '''[';
for i=1:length(waypoints)
    new = strcat(new, '[',num2str(waypoints(i,1),'%10.8f'), ', ', num2str(waypoints(i,2),'%10.8f'), '], ');
end
new = new(1:length(new)-1);
new = strcat(new,']''');
waypointString = new;

[status,cmdout] = system(['python  ' pyname ' ' waypointString '  ''' num2str(radius, '%10.5f') '''']);
newSTR = cmdout;
WPstring = newSTR(14:length(newSTR)-5);
